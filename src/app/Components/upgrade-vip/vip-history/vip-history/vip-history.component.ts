import { Component, OnInit } from '@angular/core';
import { HttpAuthService } from '../../../../../utils/HttpAuthService';
import { AppConstants } from '../../../../constant/AppConstants';
import { AuthService } from '../../../../services/auth-service/auth.service';

@Component({
  selector: 'app-vip-history',
  templateUrl: './vip-history.component.html',
  styleUrls: ['./vip-history.component.scss'],
})
export class VipHistoryComponent implements OnInit {
  paymentHistory: any[] = []; // Biến lưu trữ lịch sử thanh toán
  isLoading: boolean = true; // Trạng thái loading
  errorMessage: string | null = null; // Thông báo lỗi nếu có

  constructor(
    private httpAuthService: HttpAuthService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
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
          console.error('❌ Lỗi khi lấy lịch sử thanh toán:', response?.status);
          this.errorMessage =
            'Không thể tải lịch sử thanh toán. Vui lòng thử lại sau.';
          this.isLoading = false;
        }
      })
      .catch((err) => {
        console.error('❌ Lỗi khi gọi API:', err);
        this.errorMessage =
          'Không thể tải lịch sử thanh toán. Vui lòng thử lại sau.';
        this.isLoading = false;
      });
  }
}
