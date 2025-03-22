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

export function getImageUrlFromToken(token: string): string {
  const decoded = decodeJwt(token);
  if (!decoded.picture) {
    throw new Error('Token không chứa thông tin picture');
  }
  // decoded.picture chứa chuỗi JSON, hãy parse nó
  const pictureData = JSON.parse(decoded.picture);
  return pictureData.Url;
}
