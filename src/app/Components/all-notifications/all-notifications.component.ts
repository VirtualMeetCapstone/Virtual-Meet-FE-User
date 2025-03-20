import {Component, OnInit} from '@angular/core';
import {NotificationServiceService} from "../../services/notification-service/notification-service.service";
import {AuthService} from "../../services/auth-service/auth.service";

@Component({
  selector: 'app-all-notifications',
  templateUrl: './all-notifications.component.html',
  styleUrl: './all-notifications.component.scss'
})
export class AllNotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  isAll = true;
  isUnread = false;

  constructor(private notifyService: NotificationServiceService, private authService: AuthService) {
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
  }

  viewUnreadNotifications(): void {
    this.isUnread = true;
    this.isAll = false;
  }

}
