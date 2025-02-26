import { Component, OnInit, inject,EventEmitter, Input, Output } from '@angular/core';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../../constant/AppConstants';
@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss',
})
export class LoginModalComponent {
  @Input() isShowLoginDialog: boolean = false;
  @Output() openLoginDialog = new EventEmitter();
  user: SocialUser | null = null;
  loggedIn: boolean = false;

  private authService = inject(SocialAuthService);
  private http = inject(HttpClient);

  onClickLoginDialog() {
    this.isShowLoginDialog = !this.isShowLoginDialog;
    this.openLoginDialog.emit(this.isShowLoginDialog);
  }

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = (user != null);
      if (user) {
       this.sendTokenToBackend(user.idToken);
       console.log(user);
       console.log(user.idToken);
      }
    });
  }

  sendTokenToBackend(idToken: string) {
    this.http.post('${AppConstants.API_BASE_URL}/signin/google', { token: idToken })
      .subscribe(response => {
        console.log('Server Response:', response);
      }, error => {
        console.error('Error sending token:', error);
      });
  }

  signOut(): void {
    this.authService.signOut();
  }
}
