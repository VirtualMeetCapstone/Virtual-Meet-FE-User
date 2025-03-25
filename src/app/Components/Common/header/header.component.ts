import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild, ElementRef
} from '@angular/core';
import {AuthService} from '../../../services/auth-service/auth.service';
import {Router} from '@angular/router';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {firstValueFrom, Subject, window} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ExternalServiceService} from '../../../services/external-service/external-service.service';
import {NotificationServiceService} from "../../../services/notification-service/notification-service.service";
import {Notification} from "../../../models/notification";
import {ModalDetailpostComponent} from "../../home-page-post/modal-detailpost/modal-detailpost.component";
import {MatDialog} from "@angular/material/dialog";
import {StoryService} from "../../../services/story-service/story-service.service";
import {Story} from "../../../models/story";
import {RoomDetailModalComponent} from "../../room-detail-modal/room-detail-modal.component";
import {RoomServicesService} from "../../../services/room-service/room-services.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

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
  loading = false;
  totalNotification: number | null = null; // Để kiểm tra khi chưa load xong

  private destroy$ = new Subject<void>();
  private storiesData: Story[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private externalService: ExternalServiceService,
    private cdr: ChangeDetectorRef,
    private notifyService: NotificationServiceService,
    private dialog: MatDialog,
    private storyService: StoryService,
    private roomService: RoomServicesService,
  ) {
  }

  notifications: Notification[] = [];

  ngOnInit() {
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
    this.notifyService.onNotificationUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getAllNotification();
      });

  }

  getAllNotification() {
    this.notifyService.getNotificationByUserId(this.userId, 1000, 0).subscribe((data: any) => {

      this.totalNotification = data.totalCount;
      this.notifications = data.data; // Cập nhật danh sách nếu cần
      this.cdr.detectChanges();
    });
  }

  loadMoreNotification() {
    console.log("scroll")
    if (
      this.loading ||
      (this.totalNotification !== null && this.notifications.length >= this.totalNotification)
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
    return this.externalService.getSafeUrl(url); // Gọi từ service
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

    (window as any).location.reload();

    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
  }

  // trackByNotification(index: number, notification: any): string {
  //   return notification.id;
  // }

  getNotification(notification: Notification) {
    // alert(notification.type)
    this.markAsRead(notification.id);
    switch (notification.type) {
      case 1:

        console.log("Case 1 executed");
        break;
      case 2:// comment on post
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
      case 6:
        console.log("Case 6 executed");
        break;
      case 7:
        console.log("Case 7 executed");
        break;
      case 8:
        console.log("Case 8 executed");
        break;
      case 9:
        console.log("Case 9 executed");
        break;
      case 10:
        console.log("Case 10 executed");
        break;
      case 11:
        console.log("Case 11 executed");
        break;
      case 12:
        console.log("Case 12 executed");
        break;
      case 13:
        console.log("Case 13 executed");
        break;
      case 14:
        console.log("Case 14 executed");
        break;
      case 15:
        console.log("Case 15 executed");
        break;
      case 16:
        console.log("Case 16 executed");
        break;
      default:
        console.log("No matching case");
    }
  }


  private findStoryIndex(id: string, callback: (index: number) => void): void {
    // Nếu storiesData đã có dữ liệu, tìm ngay trong đó
    if (this.storiesData.length > 0) {
      callback(this.storiesData.findIndex((story: any) => story.id === id));
      return;
    }

    // Nếu chưa có dữ liệu, gọi API để lấy stories
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

        // Lưu vào localStorage để sử dụng lại sau này
        localStorage.setItem('storiesData', JSON.stringify(this.storiesData));

        // Gọi callback với index của story
        callback(this.storiesData.findIndex((story: any) => story.id === id));
      },
      (error: any) => {
        console.error('Error fetching stories:', error);
        callback(-1);
      }
    );
  }

  markAsRead( notificationId: string): void {
    this.notifyService.markAsRead(this.userId, notificationId).subscribe({
      next: (res) => console.log('Notification marked as read', res),
      error: (err) => console.error('Error marking as read', err)
    });

  }

}
