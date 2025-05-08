import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpAuthService } from '../../../../../utils/HttpAuthService';
import { AppConstants } from '../../../../constant/AppConstants';
import { AuthService } from '../../../../services/auth-service/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-vip-history',
  templateUrl: './vip-history.component.html',
  styleUrls: ['./vip-history.component.scss'],
})
export class VipHistoryComponent implements OnInit {
  paymentHistory: any[] = []; // Stores VIP payment history
  isLoading: boolean = true;  // Loading state
  errorMessage: string | null = null; // Error message if any

  constructor(
    private httpAuthService: HttpAuthService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userId = this.authService.getUser()?.id;
      const apiUrl = `${AppConstants.API_BASE_URL_HTTPS}/vip-payment/user/${userId}`;

      this.httpAuthService
        .fetchWithAuth(apiUrl, { method: 'GET' })
        .then((response) => {
          if (response && response.ok) {
            response.json().then((data) => {
              this.paymentHistory = data.data.map((item: any) => ({
                orderCode: item.orderCode,
                level: item.level,
                amount: item.amount,
                isPaid: item.isPaid,
                createdAt: item.createTime || 'N/A',
                expireAt: item.expireAt || 'N/A',
              }));
              this.isLoading = false;
            });
          } else {
            console.error('❌ Failed to fetch payment history:', response?.status);
            this.errorMessage = 'Unable to load payment history. Please try again later.';
            this.isLoading = false;
          }
        })
        .catch((err) => {
          console.error('❌ API call error:', err);
          this.errorMessage = 'Unable to load payment history. Please try again later.';
          this.isLoading = false;
        });
    }
  }
}
