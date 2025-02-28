import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { SocialUser } from '@abacritt/angularx-social-login';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
  isLoadingUser = true;
  user: SocialUser | null = null;
  loggedIn = false;

  constructor(private authService: AuthService, private router: Router,private sanitizer: DomSanitizer) {}

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
    this.isLoadingUser = true; // Bắt đầu loading

    this.authService.loggedIn$.subscribe((status: boolean) => {
      this.loggedIn = status;

      if (status) {
        this.user = this.authService.getUser();
      }

      // Chỉ dừng loading khi có dữ liệu user.name & user.photoUrl
      this.isLoadingUser = !(this.user?.name && this.user?.photoUrl);
    });

    if (this.authService.isLoggedIn()) {
      this.user = this.authService.getUser();
      this.isLoadingUser = !(this.user?.name && this.user?.photoUrl);
    }
  }


  onClickDropdown() {
    this.isShowDropdown = !this.isShowDropdown;
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
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
