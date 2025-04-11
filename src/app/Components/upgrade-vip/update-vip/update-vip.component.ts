import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserVipService } from '../../../services/user-vip-service/user-vip.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../../constant/AppConstants'; // Import AppConstants
import { ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef

@Component({
  selector: 'app-update-vip',
  templateUrl: './update-vip.component.html',
  styleUrls: ['./update-vip.component.scss']
})
export class UpdateVipComponent implements OnInit {
  user = {
    avatar: '',
    username: '',
    vipLevel: 'free',
    expireAt: undefined as string | undefined
  };
  userNew: any = null;

  vipPackages = [
    { id: 1, label: '1 Ngày', duration: 1, price: 10000 },
    { id: 2, label: '1 Tuần', duration: 7, price: 50000 },
    { id: 3, label: '1 Tháng', duration: 30, price: 100000 },
  ];

  selectedPack: any = null;
  paymentMessage: string | null = null; // Nội dung thông báo
  showPopup: boolean = false; // Trạng thái hiển thị popup
  isLoading: boolean = false; // Trạng thái loading

  constructor(
    private userVipService: UserVipService,
    private auth: AuthService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    const userId = this.auth.getUser()?.id;

    if (!userId) {
      return;
    }

    // Khôi phục selectedPack từ localStorage nếu có
    const savedPack = localStorage.getItem('selectedPack');
    if (savedPack) {
      this.selectedPack = JSON.parse(savedPack);
      localStorage.removeItem('selectedPack'); // Xóa sau khi dùng
    }

    this.userVipService.loadVipLevel(userId);

    this.auth.getBackendUser(userId).then((user) => {
      this.userNew = user;

      this.user.avatar = this.userNew?.picture.url;
      this.user.username = this.userNew?.name;
      this.user.vipLevel = this.userVipService.getVipLevel();
      this.user.expireAt = this.userVipService.getExpireAt();

      this.cdr.detectChanges(); // Buộc cập nhật lại UI sau khi lấy thông tin người dùng
    }).catch((err) => {
      console.error('❌ Lỗi khi lấy thông tin người dùng:', err);
    });

    // Kiểm tra query parameters để hiển thị thông báo
    this.route.queryParams.subscribe((params) => {
      const orderId = params['orderId'];
      const totalAmount = params['totalAmount'];
      const packageId = params['packageId']; // Lấy packageId từ queryParams
      const status = params['status'];

      // Kiểm tra nếu packageId không tồn tại
      if (!packageId) {
        console.warn('⚠️ Không có packageId trong queryParams.');
        return; // Không thực hiện xử lý nếu không có packageId
      }

      // Tìm gói VIP dựa trên packageId
      this.selectedPack = this.vipPackages.find(pack => pack.id === parseInt(packageId, 10));

      if (!this.selectedPack) {
        console.error('❌ Không tìm thấy gói VIP tương ứng với packageId:', packageId);
        this.paymentMessage = 'Không thể xử lý thanh toán vì không tìm thấy gói VIP.';
        this.showPopup = true;
        this.cdr.detectChanges(); // Buộc cập nhật lại UI khi hiển thị popup
        return;
      }

      if (status === 'PAID' || params['cancel'] === 'false') { // Xử lý trạng thái PAID
        this.paymentMessage = `Thanh toán thành công! Mã đơn hàng: ${orderId}, Tổng tiền: ${totalAmount} VND.`;
        console.log('Thanh toán thành công! Mã đơn hàng:', orderId, 'Tổng tiền:', totalAmount, 'VND.');

        // Gọi API để cập nhật trạng thái VIP
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + this.selectedPack.duration);
        console.log('Ngày hết hạn VIP:', expireAt.toISOString());
        console.log(' this.selectedPack.duration:', this.selectedPack.duration);

        this.updateVipLevel(userId!, 'vip', expireAt.toISOString(), () => {
          this.showPopup = true;
          this.cdr.detectChanges(); // Buộc cập nhật lại UI sau khi cập nhật trạng thái VIP
        });
      } else if (status === 'failed' || params['cancel'] === 'true') {
        this.paymentMessage = `Thanh toán thất bại! Mã đơn hàng: ${orderId}. Vui lòng thử lại.`;
        this.showPopup = true; // Hiển thị popup ngay lập tức khi thất bại
        this.cdr.detectChanges(); // Buộc cập nhật lại UI khi hiển thị popup
      }
    });
  }

  isVip(): boolean {
    return this.user.vipLevel === 'vip';
  }

  closePopup(): void {
    this.showPopup = false;
    this.cdr.detectChanges(); // Buộc cập nhật lại UI khi đóng popup
  }

  selectPack(pack: any): void {
    this.selectedPack = pack;
    localStorage.setItem('selectedPack', JSON.stringify(this.selectedPack));
    this.cdr.detectChanges(); // Buộc cập nhật lại UI khi chọn gói VIP
  }

  createVipPayment(): void {
    if (!this.selectedPack) {
      alert('Vui lòng chọn gói VIP!');
      return;
    }

    this.isLoading = true; // Bắt đầu loading
    this.cdr.detectChanges(); // Buộc cập nhật lại UI khi bắt đầu loading

    const payload = {
      packageId: this.selectedPack.id, // Gửi ID gói VIP
    };

    this.http.post<any>(`${AppConstants.API_BASE_URL_HTTPS}/vip-payment/create`, payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges(); // Buộc cập nhật lại UI khi kết thúc loading
        if (response.checkoutUrl) {
          // Chuyển hướng đến URL thanh toán
          window.location.href = response.checkoutUrl;
        } else {
          alert('Không thể tạo thanh toán. Vui lòng thử lại!');
        }
      },
      error: (err) => {
        this.isLoading = false; // Kết thúc loading
        this.cdr.detectChanges(); // Buộc cập nhật lại UI khi kết thúc loading
        console.error('❌ Lỗi khi tạo thanh toán:', err);
        alert('Đã xảy ra lỗi khi tạo thanh toán. Vui lòng thử lại!');
      }
    });
  }

  updateVipLevel(userId: string, level: 'vip', expireAt: string, callback: () => void): void {
    const payload = {
      level,
      expireAt,
    };

    this.http.post<any>(`${AppConstants.API_BASE_URL_HTTPS}/users/${userId}/vip-level`, payload).subscribe({
      next: () => {
        console.log('✅ Cập nhật trạng thái VIP thành công!');
        this.user.vipLevel = level;
        this.user.expireAt = expireAt;

        this.router.navigate(['/up-vip'], { queryParams: {}, replaceUrl: true });
        callback();
      },
      error: (err) => {
        console.error('❌ Lỗi khi cập nhật trạng thái VIP:', err);
        alert('Đã xảy ra lỗi khi cập nhật trạng thái VIP. Vui lòng thử lại!');
      },
    });
  }
}



