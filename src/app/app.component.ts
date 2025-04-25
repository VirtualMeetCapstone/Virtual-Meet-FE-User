import { Component, Inject, PLATFORM_ID, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(
    private authService: AuthService,
    private userVipService: UserVipService,
    private translate: TranslateService,
    private router: Router,
    private loadingService: LoadingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    let lang = 'en'; // Mặc định là tiếng Anh

    // Kiểm tra xem đang chạy trên trình duyệt hay không
    if (typeof window !== 'undefined' && localStorage.getItem('language')) {
      lang = localStorage.getItem('language')!;
    }

    this.loadingService.loading$.subscribe((loading) => {
      setTimeout(() => {
        this.isLoading = loading;
      });
    });


    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    console.log(lang);
    //disable header sidebar when join room
    this.router.events.subscribe(() => {
      setTimeout(() => {
        this.isRoomPage = this.router.url.startsWith('/room');
        this.isChatPage = this.router.url.startsWith('/chat');
      });
    });

  }

  onClickSideBar() {
    this.isHiddenSidebar = !this.isHiddenSidebar;
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('accessToken');
      this.isLoggedIn = !!token;
      const userId = this.authService.getUser()?.id;
      if (userId) {
        this.userVipService.loadVipLevel(userId);
      }
      if (!this.isLoggedIn) {
        this.router.navigate(['/']);
      }
    }
  }
}
