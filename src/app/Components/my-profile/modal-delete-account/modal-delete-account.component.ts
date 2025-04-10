import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteAccountService } from '../../../services/delete-account/delete-account.service';
import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modal-delete-account',
  templateUrl: './modal-delete-account.component.html',
  styleUrls: ['./modal-delete-account.component.scss'],
})
export class ModalDeleteAccountComponent {
  confirmationInput: string = ''; // Lưu chuỗi người dùng nhập
  errorMessage: string = ''; // Lưu thông báo lỗi nếu nhập sai

  constructor(
    public dialogRef: MatDialogRef<ModalDeleteAccountComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, // Dữ liệu truyền vào, chứa UUID
    private deleteAccountService: DeleteAccountService, // Service để xóa tài khoản
    private router: Router
  ) {}

  confirm(): void {
    const expectedString = `delete/${this.data.id}`; // Chuỗi xác nhận mong đợi
    if (this.confirmationInput === expectedString) {
      // Nếu chuỗi nhập vào đúng
      this.deleteAccountService.deleteAccount(this.data.id).subscribe({
        next: (response) => {
          console.log('Tài khoản đã được xóa thành công', response);
          localStorage.removeItem('accessToken'); // Xóa token nếu có
          this.dialogRef.close(true); // Đóng modal
          this.router.navigate(['/login']).then(() => {
            window.location.reload(); // Tải lại trang sau khi chuyển hướng
          });
        },
        error: (err) => {
          console.error('Lỗi khi xóa tài khoản', err);
          this.errorMessage = 'Xóa tài khoản thất bại. Vui lòng thử lại.';
        },
      });
    } else {
      // Nếu chuỗi nhập vào sai
      this.errorMessage = 'Chuỗi xác nhận không đúng. Vui lòng nhập lại.';
    }
  }

  cancel(): void {
    this.dialogRef.close(false); // Đóng modal mà không xóa
  }
}
