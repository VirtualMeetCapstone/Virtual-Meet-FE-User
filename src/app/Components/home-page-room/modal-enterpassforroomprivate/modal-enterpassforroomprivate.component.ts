import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modal-enterpassforroomprivate',
  templateUrl: './modal-enterpassforroomprivate.component.html',
  styleUrl: './modal-enterpassforroomprivate.component.scss',
})
export class ModalEnterpassforroomprivateComponent {
  isWrongPass = false;
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() roomId: string = '';
  password: string = '';
  constructor(private router: Router,private http: HttpClient) {}

  ngOnInit(): void {
    console.log(this.roomId);
  }
  async joinRoom() {
    const body = {
      roomId: this.roomId,
      password: this.password,
    };

    try {
      // Sử dụng 'text' để phản hồi trả về là chuỗi văn bản thay vì JSON
      const response = await this.http
        .post<string>('https://dev-vmeet2.runasp.net/rooms/check-password', body, {
          responseType: 'text' as 'json',  // Bỏ qua việc parse thành JSON
        })
        .toPromise();

      // Kiểm tra giá trị phản hồi (là chuỗi văn bản)
      if (response === 'Password is correct') {
        const timestamp = Date.now();
        this.router.navigate(['/room', this.roomId], {
          queryParams: { timestamp, password: this.password },
        });
      } else {
        this.isWrongPass = true;
      }
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra mật khẩu:', error);
      this.isWrongPass = true;
    }
  }


  onCloseModal() {
    this.closeModal.emit(false);
  }
}
