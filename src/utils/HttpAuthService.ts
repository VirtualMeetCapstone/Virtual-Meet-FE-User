// http-auth.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from "../app/services/auth-service/auth.service";

@Injectable({ providedIn: 'root' })
export class HttpAuthService {
  constructor(private authService: AuthService) {}

  async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response | null> {
    const accessToken = await this.authService.getValidAccessToken();

    if (!accessToken) {
      console.warn('❌ Không thể lấy access token hợp lệ');
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
}
