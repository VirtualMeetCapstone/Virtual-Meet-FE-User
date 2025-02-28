import { Component, OnInit, EventEmitter, Input, Output, inject } from '@angular/core';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../../constant/AppConstants';
import { AuthService } from '../../../services/auth-service/auth.service'; // Import AuthService để cập nhật trạng thái

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
  private customAuthService: AuthService = inject(AuthService);

  onClickLoginDialog() {
    this.openLoginDialog.emit(false);
  }

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = !!user;

      if (user) {
        this.sendTokenToBackend(user.idToken);
        this.openLoginDialog.emit(false);
        this.customAuthService.updateLoginState(true);
      }
    });
  }

  sendTokenToBackend(idToken: string) {
    const url = `${AppConstants.API_LOCAL_BASE_URL}/signin/google?idToken=${encodeURIComponent(idToken)}`;

    this.http.get<{ accessToken: string; refreshToken: string }>(url).subscribe(
      (response) => {
        if (response?.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);

          setTimeout(() => {
            this.customAuthService.updateLoginState(true);
          }, 100);
        } else {
          console.error('No accessToken in response:', response);
        }
      },
      (error) => {
        console.error('Error sending token:', error);
      }
    );
  }


  signOut(): void {
    this.authService.signOut().then(() => {
      this.user = null;
      this.loggedIn = false;
      this.customAuthService.updateLoginState(false);
      this.openLoginDialog.emit(false);
    });
  }
}
