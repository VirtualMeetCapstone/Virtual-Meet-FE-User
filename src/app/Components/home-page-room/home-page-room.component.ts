import {
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

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private roomService: RoomServicesService,
    private roomHub: RoomHubService,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    private notificationService: NotificationServiceService,
    private loadingService: LoadingService,
    private roomHubService: RoomHubService
  ) {}

  user: any = null;

  async ngOnInit() {

    this.loadingService.show(); // Hiển thị loading khi bắt đầu fetch
    this.getRoom();
    if (isPlatformBrowser(this.platformId)) {
      await this.roomHubService.startConnection();
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
  toggleDropdown(roomId: number) {
    if (this.openDropdownRoomId === roomId) {
      this.openDropdownRoomId = null;
    } else {
      this.openDropdownRoomId = roomId;
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
      this.loadingService.hide(); // Ẩn loading khi fetch thành công
    });
  }

  goToProfile(uuid: string) {
    this.router.navigate(['/my-profile', uuid]);
  }

  async joinRoom(roomId: string) {
    if (!this.user) {
      this.messages.push('Need to login before join room !!!');
      setTimeout(() => {
        this.messages = [];
      }, 3000);
      return;
    }
    const timestamp = Date.now();
    this.router.navigate(['/room', roomId], { queryParams: { timestamp } });
  }
  openModalEnterPassword(roomId: any) {
    if (!this.user) {
      this.messages.push('Need to login before join room !!!');
      setTimeout(() => {
        this.messages = [];
      }, 3000);
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
          this.messages = []; // Ẩn sau 3 giây
        }, 3000);
        this.skip = 0;
        this.rooms = [];
        this.getRoom();
      } else {
        this.showModalDeleteRoom = false;
        this.showModalAddEditRoom = false;
        this.messages.push('Update room successful !!!');
        setTimeout(() => {
          this.messages = []; // Ẩn sau 3 giây
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
}
