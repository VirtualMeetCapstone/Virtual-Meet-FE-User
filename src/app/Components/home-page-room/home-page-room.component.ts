import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { RoomServicesService } from '../../services/room-service/room-services.service';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../../services/auth-service/auth.service';
import { RoomDetailModalComponent } from '../room-detail-modal/room-detail-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { NotificationServiceService } from '../../services/notification-service/notification-service.service';
import { isPlatformBrowser } from '@angular/common';
import { LoadingService } from '../../loading.service';
import { ReportServiceService } from '../../services/report-service/report-service.service';
import { decodeJwt } from '../../../utils/jwt-helper';
import { Room } from '../../models/room';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { AppConstants } from '../../constant/AppConstants';

@Component({
  selector: 'app-home-page-room',
  templateUrl: './home-page-room.component.html',
  styleUrl: './home-page-room.component.scss',
})
export class HomePageRoomComponent implements OnInit {
  roomToDelete: any = null;
  rooms: any[] = [];
  messages: any[] = [];
  pageSize = 12;
  loading = true;
  totalRooms = 0;
  skip = 0;
  showModalDeleteRoom = false;
  showModalAddEditRoom = false;
  showModalEnterPassword = false;
  roomToEdit = null;
  userList: string[] = [];
  roomPrivateToOpenModalEnterPass: string = '';
  openDropdownRoomId: number | null = null;
  roomId: string = '';
  hasStories: boolean = false;
  private apiUrl = `${AppConstants.API_BASE_URL_HTTPS}/rooms`;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private roomService: RoomServicesService,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    private notificationService: NotificationServiceService,
    private loadingService: LoadingService,
    private roomHubService: RoomHubService,
    private reportService: ReportServiceService,
    private cdRef: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  user: any = null;
  token: string = '';
  loggedInUserId: string = '';

  isValidJwt(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3;
    } catch (e) {
      return false;
    }
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('accessToken') || '';
      if (this.token && this.isValidJwt(this.token)) {
        const decoded = decodeJwt(this.token);
        this.loggedInUserId = decoded.id;
      } else {
        console.warn('Invalid or missing JWT');
        this.loggedInUserId = '';
      }
    }
    this.loadingService.show();
    this.getRoom();
    if (isPlatformBrowser(this.platformId)) {
      await this.roomHubService.startConnection();
      this.roomHubService.receiveRoomDeleted((roomId: string) => {
        this.rooms = this.rooms.filter((room) => room.id !== roomId);
        this.cdRef.detectChanges();
      });
      window.addEventListener('scroll', this.toggleScrollButton);
    }
    this.authService.loggedIn$.subscribe((status: boolean) => {
      if (status) {
        this.user = this.authService.getUser();
      }
    });

    if (this.authService.isLoggedIn()) {
      this.user = this.authService.getUser();
    }
    this.getRoom();
    this.roomService.refreshRoom$.subscribe(() => {
      this.messages.push('Add room successful !!!');
      setTimeout(() => {
        this.messages = [];
      }, 3000);
      this.skip = 0;
      this.rooms = [];
      this.getRoom();
    });
    this.notificationService.roomDetail$.subscribe((roomId) => {
      this.roomService.getRoomById(roomId).subscribe((room: any) => {
        if (room) {
          this.viewRoomDetail(room);
        }
      });
    });
  }

  toggleDropdown(roomId: number, room: Room) {
    if (this.openDropdownRoomId === roomId) {
      this.openDropdownRoomId = null;
      this.roomId = room.id;
    } else {
      this.openDropdownRoomId = roomId;
      this.roomId = room.id;
    }
  }

  preventClose(event: Event) {
    event.stopPropagation();
  }

  @HostListener('document:click')
  closeAllDropdowns() {
    this.openDropdownRoomId = null;
  }

  toggleScrollButton = () => {
    const button = document.querySelector('.scroll-to-top') as HTMLElement;
    if (window.scrollY > 300) {
      button.classList.add('show');
    } else {
      button.classList.remove('show');
    }
  };

  getRoom() {
    this.roomService.getRooms(12, 0).subscribe((room: any) => {
      this.rooms = room.data;
      this.totalRooms = room.totalCount;
      this.loadingService.hide();
    });
  }

  goToProfile(uuid: string) {
    if (!this.user) {
      this.showErrorAlert();
      return;
    }
    this.router.navigate(['/my-profile', uuid]);
  }

  showErrorAlert() {
    Swal.fire({
      title: 'Please log in',
      text: 'You need to log in to perform this action.',
      icon: 'error',
      confirmButtonText: 'Close',
    });
  }

  async joinRoom(roomId: string) {
    if (!this.user) {
      this.showErrorAlert();
      return;
    }

    try {
      const info = await this.http
        .get<{ roomId: string; currentCount: number; maxCount: number }>(
          `${this.apiUrl}/${roomId}/member-info`
        )
        .toPromise();

      if (!info) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to retrieve room info.',
          icon: 'error',
          confirmButtonText: 'Close',
        });
      } else if (info.currentCount >= info.maxCount) {
        Swal.fire({
          title: 'Room Full',
          text: 'Room is full, please try later!',
          icon: 'warning',
          confirmButtonText: 'Close',
        });
      } else {
        const timestamp = Date.now();
        this.router.navigate(['/room', roomId], { queryParams: { timestamp } });
      }
    } catch (error) {
      console.error('Failed to get member info', error);
      Swal.fire({
        title: 'Error',
        text: 'Error checking room info.',
        icon: 'error',
        confirmButtonText: 'Close',
      });
    }
  }

  ticksToDate(ticks: number): Date {
    const ticksSinceEpoch = ticks - 621355968000000000;
    const milliseconds = ticksSinceEpoch / 10000;
    return new Date(milliseconds);
  }

  openModalEnterPassword(roomId: any) {
    if (!this.user) {
      this.showErrorAlert();
      return;
    }
    this.roomPrivateToOpenModalEnterPass = roomId;
    this.showModalEnterPassword = true;
  }

  closeModalEnterPassword(event: any) {
    this.showModalEnterPassword = false;
  }

  openModalDeleteRoom(room: any) {
    console.log('open modal');
    this.roomToDelete = room;
    this.showModalDeleteRoom = true;
  }

  openModalAddroom() {
    this.showModalAddEditRoom = true;
  }

  openModalEditRoom(room: any) {
    this.roomToEdit = room;
    console.log('room to edit', this.roomToEdit);
    this.showModalAddEditRoom = true;
  }

  closeModalDeleteRoom(event: any) {
    if (!event) {
      this.showModalDeleteRoom = false;
      this.showModalAddEditRoom = false;
    } else {
      this.messages.push('Delete room successful !!!');
      setTimeout(() => {
        this.messages = [];
      }, 3000);
      this.showModalDeleteRoom = false;
      this.showModalAddEditRoom = false;
      this.skip = 0;
      this.rooms = [];
      this.getRoom();
    }
  }

  closeModalAddRoom(event: any) {
    if (!event) {
      this.showModalDeleteRoom = false;
      this.showModalAddEditRoom = false;
      this.roomToEdit = null;
    } else {
      if (this.roomToEdit == null) {
        this.showModalDeleteRoom = false;
        this.showModalAddEditRoom = false;
        this.messages.push('Add room successful !!!');
        setTimeout(() => {
          this.messages = [];
        }, 3000);
        this.skip = 0;
        this.rooms = [];
        this.getRoom();
      } else {
        this.showModalDeleteRoom = false;
        this.showModalAddEditRoom = false;
        this.messages.push('Update room successful !!!');
        setTimeout(() => {
          this.messages = [];
        }, 3000);
        this.skip = 0;
        this.rooms = [];
        this.getRoom();
        this.roomToEdit = null;
      }
    }
  }

  loadMoreRooms() {
    this.loading = true;
    if (this.rooms.length >= this.totalRooms) {
      this.loading = false;
      return;
    }
    this.skip += this.pageSize;
    this.roomService
      .getRoomsNotNeedCount(this.pageSize, this.skip)
      .subscribe((room: any) => {
        this.rooms = [...this.rooms, ...room.data];
        if (this.rooms.length >= this.totalRooms) {
          this.loading = false;
        }
      });
  }

  openModalAddRoom() {
    this.showModalAddEditRoom = true;
  }

  viewRoomDetail(room: any) {
    const dialogRef = this.dialog.open(RoomDetailModalComponent, {
      data: { room },
    });
    console.log('room 2', room);
    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Modal đóng:', result);
    });
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  showReportModal = false;
  reportOptions: string[] = [
    'Problem involving someone under 18',
    'Bullying, harassment or abuse',
    'Suicide or self-harm',
    'Violent, hateful or disturbing content',
    'Selling or promoting restricted items',
    'Adult content',
    'Scam, fraud or false information',
    'Intellectual property',
  ];

  selectedReportReason: string = '';
  showSuccessModal = false;
  successMessage = '';

  submitReport() {
    if (!this.selectedReportReason) {
      this.successMessage = 'Please select a reason';
      this.showSuccessModal = true;
      return;
    }

    const reportPayload = {
      targetId: this.roomId,
      reporterId: this.loggedInUserId,
      reportType: 2,
      description: this.selectedReportReason,
    };

    this.reportService.sendReport(reportPayload).subscribe({
      next: () => {
        this.successMessage = 'Report submitted successfully';
        this.showSuccessModal = true;
      },
      error: (err: { error: { message: any } }) => {
        console.error(err);
        this.successMessage = err.error.message || 'Đã có lỗi xảy ra';
        this.showSuccessModal = true;
      },
    });

    this.showReportModal = false;
  }
}
