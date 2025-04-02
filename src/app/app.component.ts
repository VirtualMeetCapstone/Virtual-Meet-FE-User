import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

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


  constructor(
    private translate: TranslateService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {

    let lang = 'en'; // Mặc định là tiếng Anh

    // Kiểm tra xem đang chạy trên trình duyệt hay không
    if (typeof window !== 'undefined' && localStorage.getItem('language')) {
      lang = localStorage.getItem('language')!;
    }

    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    console.log(lang);
    //disable header sidebar when join room
    this.router.events.subscribe(() => {
      this.isRoomPage = this.router.url.startsWith('/room');
    });
  }

  onClickSideBar() {
    this.isHiddenSidebar = !this.isHiddenSidebar;
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('accessToken');
      this.isLoggedIn = !!token;
      if (!this.isLoggedIn) {
        this.router.navigate(['/']);
        console.log('Chưa đăng nhập');
      }
    }
  }
}
