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
import { HttpAuthService } from '../../../utils/HttpAuthService';

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

  selectedTab = 0;
  constructor(
    private httpAuthService: HttpAuthService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object,
    private followUserService: FollowUserService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Đăng ký subscribe route params và gọi fetchProfile
      this.route.params.subscribe(async (params) => {
        this.userId = params['id'];
        this.isOwnProfile = this.userId === this.loggedInUserId;
        if (this.userId) {
          await this.fetchProfile(this.userId);
        }
      });
    }
  }

  async fetchProfile(id: string) {
    this.isLoading = true;
    try {
      // Gọi API lấy thông tin profile
      const profileResponse = await this.httpAuthService.fetchWithAuth(
        `${AppConstants.API_BASE_URL_HTTPS}/users/${id}`
      );
      if (!profileResponse!.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileResponse!.json();
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
      const followResponse = await this.httpAuthService.fetchWithAuth(
        `${AppConstants.API_BASE_URL_HTTPS}/users/is-following/${id}`
      );
      if (!followResponse!.ok) throw new Error('Failed to fetch follow status');
      const followData = await followResponse!.json();
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

  setTab(index: number) {
    this.selectedTab = index;
  }
}
