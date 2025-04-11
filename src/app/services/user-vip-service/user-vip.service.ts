import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({ providedIn: 'root' })
export class UserVipService {
  private readonly LOCAL_KEY = 'userVip';
  private isBrowser: boolean;
  private vipLevel: 'free' | 'vip' = 'free';
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
        this.vipLevel = parsed.level;
        this.expireAt = parsed.expireAt;
      }
    }
  }

  loadVipLevel(userId: string) {
    if (!this.isBrowser) return;

    this.http.get<{ level: 'free' | 'vip', expireAt?: string }>(
      `${AppConstants.API_LOCAL_BASE_URL}/users/${userId}/vip-level`
    ).subscribe({
      next: (res) => {
        this.vipLevel = res.level;
        this.expireAt = res.expireAt;
        localStorage.setItem(this.LOCAL_KEY, JSON.stringify(res));
      },
      error: (err) => {
        console.error('Failed to load VIP level', err);
      }
    });
  }

  getVipLevel(): 'free' | 'vip' {
    return this.vipLevel;
  }

  isVip(): boolean {
    if (this.vipLevel !== 'vip') return false;
    if (!this.expireAt) return true;
    return new Date(this.expireAt) > new Date();
  }

  getExpireAt(): string | undefined {
    return this.expireAt;
  }
}
