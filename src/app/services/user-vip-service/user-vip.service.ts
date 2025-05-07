import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../constant/AppConstants';

@Injectable({ providedIn: 'root' })
export class UserVipService {
  private readonly LOCAL_KEY = 'userVip';
  private readonly TRIAL_KEY = 'voiceTrial';
  private isBrowser: boolean;
  private vipPackageId: number = 0;
  private expireAt?: string;
  private remainingVoiceTries: number = 10;

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

      // Kiểm tra và đặt lại số lượt thử nếu chưa có thông tin lưu trữ
      const trial = localStorage.getItem(this.TRIAL_KEY);
      if (trial) {
        this.remainingVoiceTries = +trial;
      } else {
        // Nếu không có thông tin trong localStorage, đặt lại số lượt về 5
        this.remainingVoiceTries = 5;
        localStorage.setItem(this.TRIAL_KEY, this.remainingVoiceTries.toString());
      }
    }
  }

  loadVipLevel(userId: string) {
    if (!this.isBrowser) return;

    this.http.get<{ packageId: number; expireAt?: string }>(`${AppConstants.API_BASE_URL_HTTPS}/users/${userId}/vip-level`)
      .subscribe({
        next: (res) => {
          this.vipPackageId = res.packageId;
          this.expireAt = res.expireAt;
          localStorage.setItem(this.LOCAL_KEY, JSON.stringify(res));
        },
        error: (err) => {
          console.error('Failed to load VIP package', err);
        }
      });
  }

  isVip(): boolean {
    if (this.vipPackageId === 0) return false;
    if (!this.expireAt) return true;
    return new Date(this.expireAt) > new Date();
  }

  getVipPackageId(): number {
    return this.vipPackageId;
  }

  getExpireAt(): string | undefined {
    return this.expireAt;
  }

  /** Voice trial logic */
  canUseVoice(): boolean {
    return this.isVip() || this.remainingVoiceTries > 0;
  }

  useVoiceTry(): void {
    if (!this.isVip() && this.remainingVoiceTries > 0) {
      this.remainingVoiceTries--;
      localStorage.setItem(this.TRIAL_KEY, this.remainingVoiceTries.toString());
    }
  }

  getRemainingTries(): number {
    return this.remainingVoiceTries;
  }
}
