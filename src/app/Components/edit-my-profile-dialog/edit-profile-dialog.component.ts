import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface EditProfileData {
  id: string;
  username: string;
  bio: string;
  avatar: string;
}

@Component({
  selector: 'app-edit-profile-dialog',
  templateUrl: './edit-profile-dialog.component.html',
  styleUrls: ['./edit-profile-dialog.component.css'],
})
export class EditProfileDialogComponent {
  newUsername: string;
  newAvatar: string;
  newBio: string;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditProfileData,
    private http: HttpClient
  ) {
    if (!data.id) {
      data.id = 'db04dba2-5640-4cd8-a5a9-119b429f2b3d';
    }
    this.newUsername = data.username;
    this.newAvatar = data.avatar;
    this.newBio = data.bio;
  }

  onSave() {
    // Nếu backend mong đợi "name" thay vì "username", thay đổi key ở đây
    const payload = {
      username: this.newUsername, // hoặc username nếu API yêu cầu
      avatar: this.newAvatar,
      bio: this.newBio,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const url = `http://dev-vmeet.runasp.net/users/db04dba2-5640-4cd8-a5a9-119b429f2b3d`;

    this.http.patch(url, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Profile updated successfully:', response);
        this.dialogRef.close(payload);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        // Hiển thị thông báo lỗi cho người dùng nếu cần
        console.log(this.data.id);
        console.log(this.data.username);
        console.log(this.data.avatar);
        console.log(this.data.bio);
      },
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
