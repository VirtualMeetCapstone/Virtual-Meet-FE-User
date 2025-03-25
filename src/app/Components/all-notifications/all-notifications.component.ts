import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NotificationServiceService} from "../../services/notification-service/notification-service.service";
import {AuthService} from "../../services/auth-service/auth.service";
import {Notification} from "../../models/notification";
import {Router} from "@angular/router";
import {StoryService} from "../../services/story-service/story-service.service";
import {Story} from "../../models/story";

@Component({
  selector: 'app-all-notifications',
  templateUrl: './all-notifications.component.html',
  styleUrl: './all-notifications.component.scss'
})
export class AllNotificationsComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  notifications: Notification[] = [];
  isAll = true;
  isUnread = false;
  totalNotification: number | null = null;
  protected loading = false;
  private pageSize = 15;
  private skip: number = 0;
  userId: string = "";
  private storiesData: Story[] = [];

  constructor(private notifyService: NotificationServiceService,
              private authService: AuthService,
              private cdr: ChangeDetectorRef,
              private router: Router,
              private storyService: StoryService,) {
  }


  ngOnInit(): void {
    this.userId = this.authService.getUser()?.id;

    this.loadMoreNotification();
  }

  viewAllNotifications(): void {
    this.isAll = true;
    this.isUnread = false;
    this.loadMoreNotification();
  }

  loadMoreNotification() {
    console.log(this.userId)
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
    console.log(this.notifications)
  }

  viewUnreadNotifications(): void {
    this.isUnread = true;
    this.isAll = false;
  }

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
      next: (res) =>
      {
        console.log('Notification marked as read', res)
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      },
      error: (err) => console.error('Error marking as read', err)
    });

  }

}
