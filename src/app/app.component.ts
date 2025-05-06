import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { UserVipService } from './services/user-vip-service/user-vip.service';
import { AuthService } from './services/auth-service/auth.service';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Virtual-Meet-FE';
  isHiddenSidebar = false;
  isLoggedIn = false;
  isRoomPage = false;
  isChatPage = false;
  isLoading = false;
  isHomePage = false;
  isRoomsPage = false;
  isRouteLoaded = false; // Thêm biến mới

  user: any = null;

  constructor(
    private authService: AuthService,
    private userVipService: UserVipService,
    private translate: TranslateService,
    private router: Router,
    private loadingService: LoadingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    let lang = 'en';
    if (isPlatformBrowser(this.platformId)) {
      if (typeof window !== 'undefined' && localStorage.getItem('language')) {
        lang = localStorage.getItem('language')!;
      }

      this.loadingService.loading$.subscribe((loading) => {
        this.isLoading = loading;
      });

      this.translate.setDefaultLang(lang);
      this.translate.use(lang);

      // Cập nhật các flag khi navigation end
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.isHomePage = event.url === '/';
          this.isRoomsPage = event.url === '/rooms';
          this.isRoomPage = event.url.startsWith('/room/');
          this.isChatPage = event.url.startsWith('/chat');
          this.isRouteLoaded = true; // Đặt true khi route load xong
        }
      });
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('accessToken');
      this.isLoggedIn = !!token;
      const userId = this.authService.getUser()?.id;
      this.user = this.authService.getUser();
      if (userId) {
        this.userVipService.loadVipLevel(userId);
      }
      if (!this.isLoggedIn) {
        this.router.navigate(['/']);
      }
      // Khởi tạo giá trị ban đầu
      this.isHomePage = this.router.url === '/';
      this.isRoomPage = this.router.url.startsWith('/room');
      this.isChatPage = this.router.url.startsWith('/chat');
      this.isRoomsPage = this.router.url === '/rooms';
      this.isRouteLoaded = true; // Đặt true sau khi khởi tạo ban đầu
    }
  }
}
