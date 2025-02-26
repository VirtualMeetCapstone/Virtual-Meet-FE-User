import { Component } from '@angular/core';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isShowDropdown: boolean = false;
  isShowLoginDialog: boolean = false;
  isShowNotification: boolean = false;
  user: SocialUser | null = null;
  loggedIn: boolean = false;

  constructor(private authService: SocialAuthService) {}

  //list notifications
  notifications = [
    {
      avatarUrl: "https://storage.googleapis.com/a1aa/image/xQVrqiEYzem7l89QM4ASfg2LRAhHpV5u6JCFKcw0pJ8.jpg",
      username: "oshp1512",
      time: "1:18 PM",
      readTime: "Vừa xong"
    },
    {
      avatarUrl: "https://storage.googleapis.com/a1aa/image/xQVrqiEYzem7l89QM4ASfg2LRAhHpV5u6JCFKcw0pJ8.jpg",
      username: "oshp1512",
      time: "1:18 PM",
      readTime: "Vừa xong"
    }
  ];


  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = user != null;
    });
  }

  onClickDropdown() {
    this.isShowDropdown = !this.isShowDropdown;
  }

  onClickLoginDialog() {
    this.isShowLoginDialog = true;
  }

  onCloseLoginDialog(event: boolean) {
    this.isShowLoginDialog = event;
  }

  onClickNotification() {
    this.isShowNotification = !this.isShowNotification;
  }

  isShowUserMenu: boolean = false;

toggleUserMenu() {
  this.isShowUserMenu = !this.isShowUserMenu;
}

editProfile() {
  console.log("Edit Profile clicked");
  // Thêm logic mở trang edit profile
}

logout() {
  this.authService.signOut().then(() => {
    this.user = null;
    this.loggedIn = false;
    this.isShowUserMenu = false; // Ẩn menu khi logout
  });
}


}
