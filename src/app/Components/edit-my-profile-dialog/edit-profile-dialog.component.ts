import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface EditProfileData {
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
  newBio: string;
  newAvatar: string;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditProfileData
  ) {
    this.newUsername = data.username;
    this.newBio = data.bio;
    this.newAvatar = data.avatar;
  }

  onSave() {
    this.dialogRef.close({
      username: this.newUsername,
      bio: this.newBio,
      avatar: this.newAvatar,
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
