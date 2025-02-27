import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EditProfileDialogComponent } from '../edit-my-profile-dialog/edit-profile-dialog.component';
import { RoomListComponent } from './room-list/room-list.component';

interface Profile {
  name: string;
  bio: string;
  followersCount: number;
  followingsCount: number;
  friendsCount: number;
  avatar: string;
}

interface PostsFeed {}

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css'],
})
export class MyProfileComponent implements OnInit {
  isLoading = true;
  userId: string = '';
  user: Profile = {
    name: '',
    bio: '',
    followersCount: 0,
    followingsCount: 0,
    friendsCount: 0,
    avatar: '',
  };

  //Select Tabs
  selectedTab = 0;

  constructor(private route: ActivatedRoute, private dialog: MatDialog) {}

  async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      this.userId = params['id']; // Gán userId từ route
      if (this.userId) {
        await this.fetchProfile(this.userId);
      }
    });
  }
  // Fetch Profile
  async fetchProfile(id: string) {
    this.isLoading = true;
    try {
      const response = await fetch(`http://dev-vmeet.runasp.net/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();

      // Gán dữ liệu từ API vào user
      this.user = {
        name: data.name,
        bio: data.bio,
        followersCount: data.followersCount,
        followingsCount: data.followingsCount,
        friendsCount: data.friendsCount,
        avatar: data.picture?.url || '',
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ------------------------------
  // Tabs
  // ------------------------------
  setTab(index: number) {
    this.selectedTab = index;
  }

  // Open Edit Profile
  openEditProfile() {
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '500px',
      data: {
        id: this.route.snapshot.params['id'], // Truyền id vào dialog
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
}
