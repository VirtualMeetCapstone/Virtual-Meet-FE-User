import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NotificationServiceService} from "../../services/notification-service/notification-service.service";
import {AuthService} from "../../services/auth-service/auth.service";
import {Notification} from "../../models/notification";

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
  totalNotification: number | null = null; // Để kiểm tra khi chưa load xong

  protected loading = false;
  private pageSize = 15;
  private skip: number = 0;
  userId: string = "";

  constructor(private notifyService: NotificationServiceService, private authService: AuthService, private cdr: ChangeDetectorRef) {
  }


  ngOnInit(): void {
    this.userId = this.authService.getUserFromToken().id;

    this.loadMoreNotification();
  }

  viewAllNotifications(): void {
    this.isAll = true;
    this.isUnread = false;
    this.loadMoreNotification();
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
        console.log(this.notifications)
      });
  }

  viewUnreadNotifications(): void {
    this.isUnread = true;
    this.isAll = false;
  }

}
