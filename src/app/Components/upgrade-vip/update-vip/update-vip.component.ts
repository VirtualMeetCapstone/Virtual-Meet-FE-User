import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserVipService } from '../../../services/user-vip-service/user-vip.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { AppConstants } from '../../../constant/AppConstants';
import { ChangeDetectorRef } from '@angular/core';
import { HttpAuthService } from '../../../../utils/HttpAuthService';

@Component({
  selector: 'app-update-vip',
  templateUrl: './update-vip.component.html',
  styleUrls: ['./update-vip.component.scss']
})
export class UpdateVipComponent implements OnInit {
  user = {
    avatar: '',
    username: '',
    vipPackageId: 0,  // Sử dụng PackageId thay vì vipLevel
    expireAt: undefined as string | undefined
  };
  userNew: any = null;

  vipPackages = [
    { id: 1, label: '1 Ngày', duration: 1, price: 10000 },
    { id: 2, label: '1 Tuần', duration: 7, price: 50000 },
    { id: 3, label: '1 Tháng', duration: 30, price: 100000 },
  ];

  userId: string | null = null;
  selectedPack: any = null;
  paymentMessage: string | null = null;
  showPopup: boolean = false;
  isLoading: boolean = false;

  constructor(
    private userVipService: UserVipService,
    private auth: AuthService,
    private httpAuthService: HttpAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.userId = this.auth.getUser()?.id;

    if (!this.userId) {
      return;
    }

    this.userVipService.loadVipLevel(this.userId);

    this.auth.getBackendUser(this.userId).then((user) => {
      this.userNew = user;

      this.user.avatar = this.userNew?.picture.url;
      this.user.username = this.userNew?.name;
      this.user.vipPackageId = this.userVipService.getVipPackageId();
      this.user.expireAt = this.userVipService.getExpireAt();

      this.cdr.detectChanges();
    }).catch((err) => {
      console.error('❌ Lỗi khi lấy thông tin người dùng:', err);
    });

    this.route.queryParams.subscribe(async (params) => {
      const orderId = params['orderCode'];
      const totalAmount = params['totalAmount'];
      const packageId = params['packageId'];
      const status = params['status'];

      if (!packageId) {
        console.warn('⚠️ Không có packageId trong queryParams.');
        return;
      }

      this.selectedPack = this.vipPackages.find(pack => pack.id === parseInt(packageId, 10));

      if (!this.selectedPack) {
        console.error('❌ Không tìm thấy gói VIP tương ứng với packageId:', packageId);
        this.paymentMessage = 'Không thể xử lý thanh toán vì không tìm thấy gói VIP.';
        this.showPopup = true;
        this.cdr.detectChanges();
        return;
      }

      if (status === 'PAID' || params['cancel'] === 'false') {
        this.paymentMessage = `Thanh toán thành công! Mã đơn hàng: ${orderId}, Tổng tiền: ${totalAmount} VND. <br> Reload sau 5 giây!`;
        console.log('Thanh toán thành công! Mã đơn hàng:', orderId, 'Tổng tiền:', totalAmount, 'VND.');

        try {
          const res = await this.httpAuthService.fetchWithAuth(
            `${AppConstants.API_BASE_URL_HTTPS}/vip-payment/mark-paid?orderCode=${orderId}`,
            { method: 'POST' }
          );

          if (!res!.ok) {
            console.warn('⚠️ Không thể đánh dấu thanh toán thành công:', res!.status);
            return; // Dừng lại nếu không thể đánh dấu thanh toán
          }

          console.log('✅ Đã đánh dấu đơn hàng là đã thanh toán.');

          const expireAt = new Date();
          expireAt.setDate(expireAt.getDate() + this.selectedPack.duration);

          this.updateVipLevel(this.userId!, this.selectedPack.id, expireAt.toISOString(), () => {
            this.showPopup = true;
            this.cdr.detectChanges();
          });
        } catch (err) {
          console.error('❌ Lỗi khi đánh dấu thanh toán:', err);
        }
      }
    });
  }

  isVip(): boolean {
    return this.user.vipPackageId !== 0;
  }

  closePopup(): void {
    this.showPopup = false;
    this.cdr.detectChanges();
  }

  selectPack(pack: any): void {
    this.selectedPack = pack;
    this.cdr.detectChanges();
  }

  createVipPayment(): void {
    if (!this.selectedPack) {
      alert('Vui lòng chọn gói VIP!');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const payload = {
      userId: this.userId,
      packageId: this.selectedPack.id,
    };

    this.httpAuthService
      .fetchWithAuth(`${AppConstants.API_BASE_URL_HTTPS}/vip-payment/create`, {
        method: 'POST',
        body: (payload) as any,
      })
      .then((response) => {
        this.isLoading = false;
        this.cdr.detectChanges();

        if (response && response.ok) {
          response.json().then((data) => {
            if (data.checkoutUrl) {
              window.location.href = data.checkoutUrl;
            } else {
              alert('Không thể tạo thanh toán. Vui lòng thử lại!');
            }
          });
        } else {
          console.error('❌ Lỗi khi tạo thanh toán:', response?.status);
          alert('Đã xảy ra lỗi khi tạo thanh toán. Vui lòng thử lại!');
        }
      })
      .catch((err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('❌ Lỗi khi gọi API tạo thanh toán:', err);
        alert('Đã xảy ra lỗi khi tạo thanh toán. Vui lòng thử lại!');
      });
  }

  updateVipLevel(userId: string, packageId: number, expireAt: string, callback: () => void): void {
    const payload = {
      packageId,
      expireAt,
    };

    this.httpAuthService
      .fetchWithAuth(`${AppConstants.API_BASE_URL_HTTPS}/users/${userId}/vip-level`, {
        method: 'POST',
        body: (payload) as any,

      })
      .then((response) => {
        if (response && response.ok) {
          console.log('✅ Cập nhật trạng thái VIP thành công!');
          this.user.vipPackageId = packageId;
          this.user.expireAt = expireAt;

          setTimeout(() => {
            window.location.reload();
          },5000);

          callback();
        } else {
          console.error('❌ Lỗi khi cập nhật trạng thái VIP:', response?.status);
          alert('Đã xảy ra lỗi khi cập nhật trạng thái VIP. Vui lòng thử lại!');
        }
      })
      .catch((err) => {
        console.error('❌ Lỗi khi gọi API cập nhật trạng thái VIP:', err);
        alert('Đã xảy ra lỗi khi cập nhật trạng thái VIP. Vui lòng thử lại!');
      });
  }
}
