import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';
export interface EditProfileData {
  id: string;
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
  userId: string;
  isLoading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditProfileData,
    private http: HttpClient
  ) {
    this.newUsername = data.username;
    this.newBio = data.bio;
    this.userId = data.id;
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    // Nếu không có file nào được chọn, không làm gì
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    // Nếu có file, lưu file đầu tiên vào biến newAvatar
    this.newAvatar = fileInput.files[0];
  }

  onSave() {
    this.isLoading = true;

    const formData = new FormData();
    if (!this.newUsername || !this.newBio) {
      alert('Vui lòng điền đầy đủ thông tin');
      this.isLoading = false;
      return;
    }
    formData.append('Name', this.newUsername);
    formData.append('Bio', this.newBio); //new

    if (this.newAvatar instanceof File) {
      formData.append('PictureUpload', this.newAvatar); // Avatar là file upload
    }
    console.log(this.userId);
    const url = `${AppConstants.API_BASE_URL_HTTPS}/users/${this.userId}`;

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
          this.isLoading = false;
        },
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
