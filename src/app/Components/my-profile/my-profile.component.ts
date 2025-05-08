import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { isPlatformBrowser } from '@angular/common';
import { decodeJwt, getImageUrlFromToken } from '../../../utils/jwt-helper';
import { EditProfileDialogComponent } from '../edit-my-profile-dialog/edit-profile-dialog.component';
import { CreateStoryDialogComponent } from '../create-story-dialog/create-story-dialog.component';
import { ModalGearButtonComponent } from './modal-gear-button/modal-gear-button.component';
import { AppConstants } from '../../constant/AppConstants';
import { FollowUserService } from '../../services/follow-user/follow-user.service';
import { lastValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ReportServiceService } from '../../services/report-service/report-service.service';
import Swal from 'sweetalert2';
interface Profile {
  name: string;
  bio: string;
  followersCount: number;
  followingsCount: number;
  friendsCount: number;
  avatar: string;
  id?: string;
}

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
})
export class MyProfileComponent implements OnInit {
  isLoading = false;
  userId: string = '';
  user: Profile = {
    name: '',
    bio: '',
    followersCount: 0,
    followingsCount: 0,
    friendsCount: 0,
    avatar: '',
  };

  // Xác định profile có phải của người dùng đăng nhập hay không
  isOwnProfile: boolean = false;
  loggedInUserId: string = '';
  blockedUsers: any[] = []; // Danh sách người dùng đã block
  loadingBlock: boolean = false;
  // Trạng thái follow của profile (nếu không phải của chính người dùng)
  isFollowing: boolean = false;
  isBlocked: boolean = false;
  isLoggedUseBlockedByUser: boolean = false;
  showBlockedListModal: boolean = false; // Trạng thái hiển thị modal
  selectedTab = 0;

  // Lưu token lấy từ localStorage
  token: string = '';

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object,
    private followUserService: FollowUserService,
    private cd: ChangeDetectorRef,
    private messageService: MessageService,
    private reportService: ReportServiceService
  ) {}

  async ngOnInit() {
    this.isLoading = true;

    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('accessToken') || '';
      const decoded = decodeJwt(this.token);
      this.loggedInUserId = decoded.id;

      this.route.params.subscribe(async (params) => {
        this.userId = params['id'];
        this.isOwnProfile = this.userId === this.loggedInUserId;
        this.loadBlockedUsers();
        const isBlocked = await this.checkIfBlockedByOther();
        if (isBlocked) {
          window.location.href = '/404';
          return;
        }

        await this.fetchProfile(this.userId);
      });
    }
  }

  async fetchProfile(id: string) {
    try {
      this.isLoading = true;

      if (!this.token) {
        console.error('Token not found, vui lòng đăng nhập lại.');
        return;
      }
      this.CheckUserIdBlockedByLoggedInUserOrNot();

      console.log('ko cook');
      const profileResponse = await fetch(
        `${AppConstants.API_BASE_URL_HTTPS}/users/${id}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      if (!profileResponse.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileResponse.json();
      this.user = {
        name: profileData.name,
        bio: profileData.bio,
        followersCount: profileData.followersCount,
        followingsCount: profileData.followingsCount,
        friendsCount: profileData.friendsCount,
        avatar: profileData.picture?.url || '',
        id: profileData.id,
      };

      // Gọi API kiểm tra trạng thái follow dựa vào token
      const followResponse = await fetch(
        `${AppConstants.API_BASE_URL_HTTPS}/users/is-following/${id}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      if (!followResponse.ok) throw new Error('Failed to fetch follow status');
      const followData = await followResponse.json();
      console.log('Dữ liệu follow status:', followData); // Debug log
      // Giả sử BE trả về { isFollowing: true/false }
      this.isFollowing = followData === true || followData === 'true';
    } catch (error) {
      console.error('Error fetching profile or follow status:', error);
    } finally {
      this.isLoading = false;
      // Ép Angular cập nhật giao diện nếu cần
      this.cd.detectChanges();
    }
  }
  CheckUserIdBlockedByLoggedInUserOrNot() {
    this.followUserService
      .viewListBlockedByUser(this.loggedInUserId)
      .subscribe((data: any) => {
        console.log('list block', data);
        this.isBlocked = data.some(
          (blockedUser: any) => blockedUser.blockedByUserId === this.userId
        );
      });
  }
  checkIfBlockedByOther(): Promise<boolean> {
    return lastValueFrom(
      this.followUserService.ViewListPeopleBlockedUser(this.loggedInUserId)
    ).then((data: any) => {
      console.log('list user block Loggeduser', data);
      const isBlocked = data.some(
        (blockedUser: any) => blockedUser.blockedByUserId === this.userId
      );
      console.log('bi block', isBlocked);
      return isBlocked;
    });
  }

  // Hàm mở modal chỉnh sửa profile
  openEditProfile() {
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '500px',
      data: {
        id: this.userId,
        username: this.user.name,
        bio: this.user.bio,
        avatar: this.user.avatar,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.user.name = result.username;
        this.user.bio = result.bio;
        this.user.avatar = result.avatar;
      }
    });
  }

  // Hàm mở modal tạo story
  openCreateProfileStory() {
    const dialogRef = this.dialog.open(CreateStoryDialogComponent, {
      width: '500px',
      data: { id: this.userId },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('New story added:', result);
      }
    });
  }

  openGearButton() {
    const dialogRef = this.dialog.open(ModalGearButtonComponent, {
      width: '300px',
      data: { id: this.userId },
    });
  }

  // Hàm toggle follow/unfollow sử dụng async/await và gọi lại fetchProfile để cập nhật thông tin mới
  async toggleFollow() {
    console.log('followingId:', this.userId);
    console.log('followerId:', this.loggedInUserId);
    try {
      // Chuyển Observable thành Promise để chờ toggle hoàn thành
      await lastValueFrom(
        this.followUserService.followUser(this.userId, this.loggedInUserId)
      );
      // Sau khi toggle thành công, gọi lại fetchProfile để cập nhật dữ liệu
      await this.fetchProfile(this.userId);
      // Ép Angular cập nhật giao diện
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  }
  async toggleBlock() {
    try {
      // Chuyển Observable thành Promise để chờ toggle hoàn thành
      await lastValueFrom(
        this.followUserService.blockUser(this.userId, this.loggedInUserId)
      );
      // Sau khi toggle thành công, gọi lại fetchProfile để cập nhật dữ liệu
      await this.fetchProfile(this.userId);
      // Ép Angular cập nhật giao diện
      this.cd.detectChanges();
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  }
  blockUser(userId: string) {
    this.followUserService.blockUser(userId, this.loggedInUserId).subscribe({
      next: (response: any) => {
        this.loadBlockedUsers();
      },
      error: (err: any) => {
        console.error('Error blocking user:', err);
      },
    });
  }
  setTab(index: number) {
    this.selectedTab = index;
  }

  async copyProfileLink() {
    if (!this.userId) {
      console.error('User ID is not set');
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể copy link: User ID không tồn tại',
        life: 2000,
      });
      return;
    }

    const profileUrl = `https://fe.dev-vmeet.site/my-profile/${this.userId}`;

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(profileUrl);
        this.showCopySuccessMessage();
      } catch (err) {
        console.error('Lỗi khi copy link: ', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Lỗi khi copy link',
          life: 2000,
        });
      }
    } else {
      console.warn('Clipboard API not supported');
      const textarea = document.createElement('textarea');
      textarea.value = profileUrl;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.showCopySuccessMessage();
      } catch (err) {
        console.error('Lỗi khi copy link bằng fallback: ', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Lỗi khi copy link',
          life: 2000,
        });
      }
      document.body.removeChild(textarea);
    }
  }

  async showCopySuccessMessage() {
    Swal.fire({
      icon: 'success',
      title: 'Thành công',
      text: 'Link hồ sơ đã được sao chép!',
      timer: 3000,
    });
  }

  showReportPopup = false;
  selectedReason: string = '';
  reportReason: string = '';

  toggleReport() {
    this.showReportPopup = !this.showReportPopup;
    this.selectedReason = '';
    this.reportReason = '';
  }

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
  showReportModal = false;
  showSuccessModal = false;
  successMessage = '';
  submitReport() {
    if (!this.selectedReportReason) {
      alert('Vui lòng chọn lý do');
      return;
    }

    let description =
      this.selectedReportReason === 'Other'
        ? this.selectedReportReason.trim()
        : this.selectedReportReason;
    if (this.selectedReportReason === 'Other' && !description) {
      alert('Vui lòng nhập mô tả');
      return;
    }

    const reportPayload = {
      targetId: this.userId,
      reporterId: this.loggedInUserId,
      reportType: 0,
      description: description,
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

  openBlockedListModal(): void {
    this.showBlockedListModal = true;
  }

  closeBlockedListModal(): void {
    this.showBlockedListModal = false;
  }
  loadBlockedUsers(): void {
    this.loadingBlock = true;
    this.followUserService
      .viewListBlockedByUser(this.userId)
      .subscribe((data: any) => {
        this.blockedUsers = data.map((blockedUser: any) => ({
          id: blockedUser.blockedByUserId,
          name: blockedUser.name,
          avatar: blockedUser.picture?.url,
        }));
        this.loadingBlock = false;
      });
  }
}
