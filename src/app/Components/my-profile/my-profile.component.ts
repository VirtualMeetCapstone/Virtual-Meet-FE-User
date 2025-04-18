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
  styleUrls: ['./my-profile.component.css'],
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
  isOwnProfile: boolean = true;
  loggedInUserId: string = '';

  // Trạng thái follow của profile (nếu không phải của chính người dùng)
  isFollowing: boolean = false;
  isBlocked: boolean = false;
  isLoggedUseBlockedByUser: boolean = false;

  selectedTab = 0;

  // Lưu token lấy từ localStorage
  token: string = '';

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object,
    private followUserService: FollowUserService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.isLoading = true;

    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('accessToken') || '';
      if (!this.token) {
        console.error('Token not found, vui lòng đăng nhập lại.');
        return;
      }

      try {
        const decoded = decodeJwt(this.token);
        this.loggedInUserId = decoded.id;
      } catch (error) {
        console.error('Lỗi khi giải mã token:', error);
        return;
      }

      const params = this.route.snapshot.params;
      this.userId = params['id'];
      this.isOwnProfile = this.userId === this.loggedInUserId;

      // ✅ Kiểm tra block trước khi làm gì khác
      const isBlocked = await this.checkIfBlockedByOther();
      if (isBlocked) {
        console.log('Bị block, chuyển trang 404');
        window.location.href = '/404';
        return;
      }

      // ✅ Chỉ fetch nếu không bị block
      await this.fetchProfile(this.userId);
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

  setTab(index: number) {
    this.selectedTab = index;
  }
}
