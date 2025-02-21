import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface EditProfileData {
  username: string;
  bio: string;
  avatar: File | null; // Chấp nhận File thay vì string
}

@Component({
  selector: 'app-edit-profile-dialog',
  templateUrl: './edit-profile-dialog.component.html',
  styleUrls: ['./edit-profile-dialog.component.css'],
})
export class EditProfileDialogComponent {
  newUsername: string;
  newAvatar: File | null = null;
  newBio: string;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditProfileData,
    private http: HttpClient
  ) {
    this.newUsername = data.username;
    this.newBio = data.bio;
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.newAvatar = fileInput.files[0]; // Lưu file vào biến
    }
  }

  onSave() {
    const formData = new FormData();
    if (!this.newUsername || !this.newBio) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    formData.append('Name', this.newUsername);
    formData.append('Bio', this.newBio);//new

    if (this.newAvatar instanceof File) {
      formData.append('PictureUpload', this.newAvatar); // Avatar là file upload
    }

    const url = `http://dev-vmeet.runasp.net/users/db04dba2-5640-4cd8-a5a9-119b429f2b32`;

    this.http
      .patch(url, formData)
      .pipe(
        catchError((error) => {
          console.error('Error updating profile:', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Profile updated successfully:', data);
          console.log(formData);
          this.dialogRef.close(data);
          console.log(this.newUsername, this.newBio);

          window.location.reload();
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
