export function decodeJwt(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('JWT không hợp lệ');
  }
  // Chuyển đổi Base64 URL sang Base64 chuẩn
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(payload)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() > exp;
  } catch (e) {
    return true;
  }
}

export function getImageUrlFromToken(token: string): string {
  const decoded = decodeJwt(token);
  if (!decoded.picture) {
    throw new Error('Token không chứa thông tin picture');
  }
  // decoded.picture chứa chuỗi JSON, hãy parse nó
  const pictureData = JSON.parse(decoded.picture);
  return pictureData.Url;
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response | null> {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken || isTokenExpired(accessToken)) {
    console.warn('⛔ Token không tồn tại hoặc đã hết hạn. Redirect đến login.');
    return null;
  }

  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: isFormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined,
    });

    if (response.status === 401) {
      console.warn('⛔ Server báo token không hợp lệ.');
      return null;
    }

    return response;
  } catch (error) {
    console.error('❌ Lỗi gọi API:', error);
    return null;
  }
}
