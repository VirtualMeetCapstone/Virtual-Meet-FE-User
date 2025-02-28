import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { SocialUser } from '@abacritt/angularx-social-login';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  isShowDropdown = false;
  isShowLoginDialog = false;
  isShowNotification = false;
  isShowUserMenu = false;

  user: SocialUser | null = null;
  loggedIn = false;

  constructor(private authService: AuthService, private router: Router) {}

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
    this.authService.loggedIn$.subscribe((status) => {
      this.loggedIn = status;

      setTimeout(() => {
        this.user = this.authService.getUser();
      }, 200);
    });

    if (this.authService.isLoggedIn()) {
      setTimeout(() => {
        this.user = this.authService.getUser();
      }, 200);
    }
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

  toggleUserMenu() {
    this.isShowUserMenu = !this.isShowUserMenu;
  }
  editProfile() {
    if (!this.user) {
      return;
    }
    this.isShowUserMenu = false;
    this.router.navigate([`/my-profile/${this.user.id}`]);
  }

  logout() {
    this.authService.logout();
    this.user = null;
    this.loggedIn = false;
    this.isShowUserMenu = false;
  }
}
