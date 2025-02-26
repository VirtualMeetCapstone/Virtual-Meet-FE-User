import { Component, OnInit, EventEmitter, Input, Output, inject } from '@angular/core';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../../constant/AppConstants';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss',
})
export class LoginModalComponent implements OnInit {
  @Input() isShowLoginDialog: boolean = false;
  @Output() openLoginDialog = new EventEmitter<boolean>();
  user: SocialUser | null = null;
  loggedIn: boolean = false;

  private authService = inject(SocialAuthService);
  private http = inject(HttpClient);

  onClickLoginDialog() {
    this.openLoginDialog.emit(false); // ✅ Gửi event đóng modal lên Header
  }

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = user != null;
      if (user) {
        console.log(user);
       // this.sendTokenToBackend(user.idToken);
       this.openLoginDialog.emit(false);
      }
    });
  }

  sendTokenToBackend(idToken: string) {
    this.http.post(`${AppConstants.API_BASE_URL}/signin/google`, { token: idToken })
      .subscribe(response => {
        console.log('Server Response:', response);
        this.openLoginDialog.emit(false); // ✅ Đóng modal sau khi đăng nhập thành công
      }, error => {
        console.error('Error sending token:', error);
      });
  }

  signOut(): void {
    this.authService.signOut().then(() => {
      this.user = null;
      this.loggedIn = false;
      this.openLoginDialog.emit(false); // ✅ Đóng modal khi đăng xuất
    });
  }
}
