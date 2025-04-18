import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
  Inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExternalServiceService } from '../../../services/external-service/external-service.service';
import { NotificationServiceService } from '../../../services/notification-service/notification-service.service';
import { Notification } from '../../../models/notification';
import { StoryService } from '../../../services/story-service/story-service.service';
import { Story } from '../../../models/story';
import { TranslateService } from '@ngx-translate/core';
import { PLATFORM_ID } from '@angular/core';
import { HomePageRoomComponent } from '../../home-page-room/home-page-room.component';
import {LogoServiceService} from "../../../services/logo-service/logo-service.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  isShowMobileMenu = false;

  lastScrollTop = 0;
  isHidden = false;
  isSticky = false;
  showModalAddRoom = false;
  isShowDropdown = false;
  isShowLoginDialog = false;
  isShowNotification = false;
  isShowUserMenu = false;
  isLoadingUser = true;
  user: any = null;
  loggedIn = false;
  idNew: string = '';
  userId: string = '';
  pageSize: number = 10;
  skip: number = 0;
  currentLanguage = 'en';
  loading = false;
  totalNotification: number | null = null;

  private destroy$ = new Subject<void>();
  private storiesData: Story[] = [];

  notifications: Notification[] = [];

  @ViewChild(HomePageRoomComponent, { static: false })
  homePageRoomComponent!: HomePageRoomComponent;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  logoUrl = "";

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-icon')) {
      this.isShowNotification = false;
    }
    if (!target.closest('.user-info')) {
      this.isShowUserMenu = false;
    }
    if (!target.closest('.menu-icon')) {
      this.isShowDropdown = false;
    }
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private externalService: ExternalServiceService,
    private cdr: ChangeDetectorRef,
    private notifyService: NotificationServiceService,
    private storyService: StoryService,
    private translate: TranslateService,
    private logoService: LogoServiceService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('language');
      if (savedLang) {
        this.currentLanguage = savedLang;
        this.translate.use(this.currentLanguage);
      } else {
        localStorage.setItem('language', this.currentLanguage);
        this.translate.setDefaultLang(this.currentLanguage);
      }
    }

    this.isLoadingUser = true;
    this.authService.loggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (status: boolean) => {
        this.loggedIn = status;
        if (status) {
          const userId = this.authService.getUser()?.id;
          if (userId) {
            this.idNew = userId;
            this.user = await this.authService.getBackendUser(userId);
            if (!this.user.id) {
              this.user.id = this.idNew;
            }
          }
        } else {
          this.user = null;
        }
        this.isLoadingUser = !(this.user?.name && this.user?.picture?.url);
        this.cdr.markForCheck();
      });

    if (this.authService.isLoggedIn()) {
      const userId = this.authService.getUser()?.id;
      if (userId) {
        this.authService.getBackendUser(userId).then((user) => {
          this.user = user;
          this.isLoadingUser = !(this.user?.name && this.user?.picture?.url);
          this.cdr.markForCheck();
        });
      }
    }
    this.userId = this.authService.getUser()?.id;
    this.loadMoreNotification();
    this.notifyService
      .onNotificationUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getAllNotification();
      });
    this.logoService.getLogo().subscribe({
      next: (res) => {
        if (res?.media?.url) {
          this.logoUrl = res.media.url;
        }
      },
      error: () => {
        console.error('Failed to load logo');
      }
    });
  }

  getAllNotification() {
    this.notifyService
      .getNotificationByUserId(this.userId, 1000, 0)
      .subscribe((data: any) => {
        this.totalNotification = data.totalCount;
        this.notifications = data.data;
        this.cdr.detectChanges();
      });
  }

  loadMoreNotification() {
    if (
      this.loading ||
      (this.totalNotification !== null &&
        this.notifications.length >= this.totalNotification)
    ) {
      return;
    }
    this.loading = true;
    this.notifyService
      .getNotificationByUserId(this.userId, this.pageSize, this.skip)
      .subscribe((data: any) => {
        this.notifications = [...this.notifications, ...data.data];
        this.totalNotification = data.totalCount;
        this.skip += this.pageSize;
        this.loading = false;
        this.cdr.detectChanges();
      });
  }

  getSafeUrl(url: any) {
    return this.externalService.getSafeUrl(url);
  }

  editProfile() {
    if (!this.idNew) {
      return;
    }
    this.isShowUserMenu = false;
    this.router.navigate([`/my-profile/${this.idNew}`]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    setTimeout(() => {
      if (this.isShowNotification) {
        this.loadMoreNotification();
      }
    }, 100);
  }

  toggleUserMenu() {
    this.isShowUserMenu = !this.isShowUserMenu;
  }

  logout() {
    this.authService.logout();
    this.user = null;
    this.loggedIn = false;
    this.isShowUserMenu = false;
    if (isPlatformBrowser(this.platformId)) {
      window.location.reload();
    }
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {}

  getNotification(notification: Notification) {
    this.markAsRead(notification.id);
    switch (notification.type) {
      case 1:
        console.log('Case 1 executed');
        break;
      case 2: // comment on post
        if (notification.source.id) {
          this.router.navigate(['/posts']).then(() => {
            setTimeout(() => {
              this.notifyService.triggerOpenPostModal(notification.source.id);
            }, 500);
          });
        } else {
          this.router.navigate(['/not-found']);
        }
        break;
      case 3: // new story notification
        this.findStoryIndex(notification.source.id, (index) => {
          if (index !== -1) {
            this.notifyService.triggerOpenStory(index);
          } else {
            this.router.navigate(['/not-found']);
          }
        });
        break;
      case 4: // new room notification
        this.router.navigate(['/']).then(() => {
          setTimeout(() => {
            this.notifyService.openRoomDetail(notification.source.id);
          }, 500);
        });
        break;
      case 5: // new post notification
        if (notification.source.id) {
          this.router.navigate(['/posts']).then(() => {
            setTimeout(() => {
              this.notifyService.triggerOpenPostModal(notification.source.id);
            }, 500);
          });
        } else {
          this.router.navigate(['/not-found']);
        }
        break;
      default:
        console.log('No matching case');
    }
  }

  private findStoryIndex(id: string, callback: (index: number) => void): void {
    if (this.storiesData.length > 0) {
      callback(this.storiesData.findIndex((story: any) => story.id === id));
      return;
    }
    this.storyService.getStories(this.userId).subscribe(
      (response: any) => {
        if (Array.isArray(response)) {
          this.storiesData = response;
        } else if (response && Array.isArray(response.data)) {
          this.storiesData = response.data;
        } else {
          console.error('Unexpected response format:', response);
          callback(-1);
          return;
        }
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('storiesData', JSON.stringify(this.storiesData));
        }
        callback(this.storiesData.findIndex((story: any) => story.id === id));
      },
      (error: any) => {
        console.error('Error fetching stories:', error);
        callback(-1);
      }
    );
  }

  markAsRead(notificationId: string): void {
    this.notifyService.markAsRead(this.userId, notificationId).subscribe({
      next: (res) => console.log('Notification marked as read', res),
      error: (err) => console.error('Error marking as read', err),
    });
  }

  toggleLanguage(event: Event) {
    event.preventDefault();
    this.currentLanguage = this.currentLanguage === 'en' ? 'vi' : 'en';
    this.switchLanguage(this.currentLanguage);
  }

  switchLanguage(lang: string) {
    this.translate.use(lang).subscribe(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('language', lang);
      }
    });
  }

  openModalAddRoom() {
    this.showModalAddRoom = true;
    console.log(this.userId);
  }

  closeModalAddRoom(event: any) {
    if (!event) {
      this.showModalAddRoom = false;
    } else {
      if (this.router.url !== '/')
        (globalThis as any).alert('Add room successful !!!!');
    }
    this.showModalAddRoom = false;
  }
  toggleMobileMenu() {
    this.isShowMobileMenu = !this.isShowMobileMenu;
  }
}
