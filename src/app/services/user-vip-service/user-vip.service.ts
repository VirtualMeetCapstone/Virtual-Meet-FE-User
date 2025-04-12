import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({ providedIn: 'root' })
export class UserVipService {
  private readonly LOCAL_KEY = 'userVip';
  private isBrowser: boolean;
  private vipPackageId: number = 0;  // Sử dụng packageId thay vì level
  private expireAt?: string;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const cached = localStorage.getItem(this.LOCAL_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.vipPackageId = parsed.packageId;
        this.expireAt = parsed.expireAt;
      }
    }
  }

  loadVipLevel(userId: string) {
    if (!this.isBrowser) return;

    this.http.get<{ packageId: number, expireAt?: string }>(
      `${AppConstants.API_BASE_URL_HTTPS}/users/${userId}/vip-level`
    ).subscribe({
      next: (res) => {
        console.log('VIP package loaded:', res);
        this.vipPackageId = res.packageId;
        this.expireAt = res.expireAt;
        localStorage.setItem(this.LOCAL_KEY, JSON.stringify(res));
      },
      error: (err) => {
        console.error('Failed to load VIP package', err);
      }
    });
  }

  getVipPackageId(): number {
    return this.vipPackageId;
  }

  isVip(): boolean {
    // Kiểm tra nếu gói VIP tồn tại và chưa hết hạn
    if (this.vipPackageId === 0) return false;
    if (!this.expireAt) return true;
    return new Date(this.expireAt) > new Date();
  }

  getExpireAt(): string | undefined {
    return this.expireAt;
  }
}
