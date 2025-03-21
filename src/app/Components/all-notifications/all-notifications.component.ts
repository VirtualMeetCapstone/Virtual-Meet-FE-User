import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {NotificationServiceService} from "../../services/notification-service/notification-service.service";
import {AuthService} from "../../services/auth-service/auth.service";
import {Notification} from "../../models/notification";

@Component({
  selector: 'app-all-notifications',
  templateUrl: './all-notifications.component.html',
  styleUrl: './all-notifications.component.scss'
})
export class AllNotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  isAll = true;
  isUnread = false;
  private totalNotification: number = 0;
  protected loading = true;
  private pageSize = 10;
  private skip: number = 0;

  constructor(private notifyService: NotificationServiceService, private authService: AuthService, private cdr: ChangeDetectorRef) {
  }

  userId: string = this.authService.getUser().userId;

  ngOnInit(): void {

  }

  viewAllNotifications(): void {
    // this.notifyService.getNotificationByUserId(this.userId).subscribe(response => {
    //   this.notifications = response.data;
    //   this.isAll = true;
    //   this.isUnread = false;
    // });
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

      });
  }

  viewUnreadNotifications(): void {
    this.isUnread = true;
    this.isAll = false;
  }

}
