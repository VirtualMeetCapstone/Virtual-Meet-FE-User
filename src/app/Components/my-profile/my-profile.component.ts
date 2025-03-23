import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { isPlatformBrowser } from '@angular/common';
import { decodeJwt, getImageUrlFromToken } from '../../../utils/jwt-helper';
import { EditProfileDialogComponent } from '../edit-my-profile-dialog/edit-profile-dialog.component';
import { CreateStoryDialogComponent } from '../create-story-dialog/create-story-dialog.component';
import { ModalGearButtonComponent } from './modal-gear-button/modal-gear-button.component';
import { AppConstants } from '../../constant/AppConstants';
import { FollowUserService } from '../../services/follow-user/follow-user.service';

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

  // Biến để xác định profile có phải của người dùng đăng nhập hay không
  isOwnProfile: boolean = true;
  loggedInUserId: string = '';

  // Biến lưu trạng thái follow (chỉ áp dụng cho profile của người khác)
  isFollowing: boolean = false;

  selectedTab = 0;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object,
    private followUserService: FollowUserService
  ) {}

  async ngOnInit() {
    // Lấy user id của người dùng đang đăng nhập từ token (chỉ truy cập localStorage trên trình duyệt)
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decoded = decodeJwt(token);
          this.loggedInUserId = decoded.id;
        } catch (error) {
          console.error('Lỗi khi giải mã token:', error);
        }
      }
    }

    this.route.params.subscribe(async (params) => {
      this.userId = params['id']; // Lấy userId từ route
      this.isOwnProfile = this.userId === this.loggedInUserId;
      if (this.userId) {
        await this.fetchProfile(this.userId);
      }
    });
  }

  async fetchProfile(id: string) {
    this.isLoading = true;
    try {
      const response = await fetch(
        `${AppConstants.API_BASE_URL_HTTPS}/users/${id}`
      );
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      this.user = {
        name: data.name,
        bio: data.bio,
        followersCount: data.followersCount,
        followingsCount: data.followingsCount,
        friendsCount: data.friendsCount,
        avatar: data.picture?.url || '',
        id: data.id,
      };

      // Nếu đang xem profile của người khác, bạn có thể gọi API để kiểm tra trạng thái follow
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Các hàm mở modal dành cho profile của chính người dùng
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

  // Hàm toggle follow/unfollow dành cho profile của người khác
  toggleFollow() {
    console.log('followingId (người được follow):', this.userId);
    console.log('followerId (người follow):', this.loggedInUserId);

    this.followUserService
      .followUser(this.userId, this.loggedInUserId)
      .subscribe({
        next: (res: any) => {
          // Giả sử BE trả về kết quả với isFollowing và followersCount
          if (res && typeof res.isFollowing === 'boolean') {
            this.isFollowing = res.isFollowing;
            this.user.followersCount = res.followersCount;
          } else {
            // Nếu không có response rõ ràng, tự toggle
            this.isFollowing = !this.isFollowing;
            if (this.isFollowing) {
              this.user.followersCount++;
            } else {
              this.user.followersCount = Math.max(
                this.user.followersCount - 1,
                0
              );
            }
          }
        },
        error: (error) => {
          console.error('Error toggling follow status:', error);
        },
      });
  }

  setTab(index: number) {
    this.selectedTab = index;
  }
}
