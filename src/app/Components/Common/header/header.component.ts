import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExternalServiceService } from '../../../services/external-service/external-service.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  isShowDropdown = false;
  isShowLoginDialog = false;
  isShowNotification = false;
  isShowUserMenu = false;
  isLoadingUser = true;
  user: any = null;
  loggedIn = false;
  idNew: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private externalService: ExternalServiceService,
    private cdr: ChangeDetectorRef
  ) {}

  notifications = [
    {
      avatarUrl: "https://storage.googleapis.com/a1aa/image/xQVrqiEYzem7l89QM4ASfg2LRAhHpV5u6JCFKcw0pJ8.jpg",
      username: "oshp1512",
      time: "1:18 PM",
      readTime: "Vừa xong",
    },
    {
      avatarUrl: "https://storage.googleapis.com/a1aa/image/xQVrqiEYzem7l89QM4ASfg2LRAhHpV5u6JCFKcw0pJ8.jpg",
      username: "oshp1512",
      time: "1:18 PM",
      readTime: "Vừa xong",
    },
  ];

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
  }

  toggleUserMenu() {
    this.isShowUserMenu = !this.isShowUserMenu;
  }

  logout() {
    this.authService.logout();
  this.user = null;
  this.loggedIn = false;
  this.isShowUserMenu = false;

  window.location.reload();
  this.cdr.markForCheck();
  }

  trackByNotification(index: number, notification: any): number {
    return index;
  }
}
