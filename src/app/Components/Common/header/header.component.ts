import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild, ElementRef
} from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {Subject, window} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExternalServiceService } from '../../../services/external-service/external-service.service';
import {NotificationServiceService} from "../../../services/notification-service/notification-service.service";
import {Notification} from "../../../models/notification";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy , AfterViewInit {
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
  pageSize: number = 5;
  skip: number = 0;
  loading = false;
  totalNotification: number | null = null; // Để kiểm tra khi chưa load xong

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private externalService: ExternalServiceService,
    private cdr: ChangeDetectorRef,
    private notifyService: NotificationServiceService
  ) {}

  notifications : Notification[] = [];

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
      .getNotificationByUserId(this.userId,this.pageSize, this.skip)
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

}
