import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Virtual-Meet-FE';
  isHiddenSidebar = false;
  isLoggedIn = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
