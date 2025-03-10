import { Component, OnInit, EventEmitter, Input, Output, inject } from '@angular/core';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../../constant/AppConstants';
import { AuthService } from '../../../services/auth-service/auth.service';
import { take, switchMap } from 'rxjs/operators';

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
  customAuthService: AuthService = inject(AuthService);

  onClickLoginDialog() {
    this.openLoginDialog.emit(false);
  }

  ngOnInit() {
    this.authService.authState.pipe(take(1)).subscribe((user) => {
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
    const url = `${AppConstants.API_BASE_URL_HTTP}/signin/google?idToken=${encodeURIComponent(idToken)}`;

    this.http.get<{ accessToken: string; refreshToken: string }>(url).pipe(
      take(1),
      switchMap(response => {
        if (response?.accessToken) {
          this.customAuthService.setToken(response.accessToken, response.refreshToken);
          return [true];
        }
        return [false];
      })
    ).subscribe(
      isLoggedIn => this.customAuthService.updateLoginState(isLoggedIn),
      error => console.error('Error sending token:', error)
    );
  }


  signOut(): void {
    this.authService.signOut().then(() => {
      this.user = null;
      this.loggedIn = false;
      this.customAuthService.logout();
      this.openLoginDialog.emit(false);
    });
  }
}
