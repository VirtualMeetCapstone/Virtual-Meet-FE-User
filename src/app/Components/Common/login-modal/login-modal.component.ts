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
    this.openLoginDialog.emit(false);
  }

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = user != null;
      if (user) {
        // console.log(user);
        this.sendTokenToBackend(user.idToken);
       this.openLoginDialog.emit(false);
      }
    });
  }

  sendTokenToBackend(idToken: string) {
    const url = `${AppConstants.API_BASE_URL}/signin/google?idToken=${encodeURIComponent(idToken)}`;

    this.http.get(url).subscribe(response => {
      // console.log('Server Response:', response);
      this.openLoginDialog.emit(false);
    }, error => {
      console.error('Error sending token:', error);
    });
  }

  signOut(): void {
    this.authService.signOut().then(() => {
      this.user = null;
      this.loggedIn = false;
      this.openLoginDialog.emit(false); 
    });
  }
}
