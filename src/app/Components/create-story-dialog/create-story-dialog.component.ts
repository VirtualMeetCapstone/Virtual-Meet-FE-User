import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';
import { EditProfileDialogComponent } from '../edit-my-profile-dialog/edit-profile-dialog.component';

export interface CreateStoryData {
  id: string;
  username: string;
  avatar: string;
}

@Component({
  selector: 'app-create-story-dialog',
  templateUrl: './create-story-dialog.component.html',
  styleUrls: ['./create-story-dialog.component.scss'],
})
export class CreateStoryDialogComponent {
  // Thuộc tính
  id: string;
  newUsername: string;
  newAvatar: File | null = null;
  newContent: string = '';
  newMusicUrl: string = '';
  isLoading: boolean = false;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    public dialogRef: MatDialogRef<CreateStoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateStoryData,
    private http: HttpClient
  ) {
    this.id = data.id;
    this.newUsername = data.username;
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    this.newAvatar = fileInput.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(this.newAvatar);
  }

  // Tạo tin (story)
  onSave() {
    // Kiểm tra nội dung
    if (!this.newContent) {
      alert('Vui lòng nhập nội dung đăng tin');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('Content', this.newContent);
    formData.append('UserId', this.id);
    formData.append('TextContent', this.newContent);
    formData.append('MusicUrl', this.newMusicUrl);

    if (this.newAvatar) {
      formData.append('MediaUpload', this.newAvatar);
    } else {
      formData.append('MediaUpload', '');
    }

    // Gửi request POST
    this.http
      .post(`${AppConstants.API_BASE_URL_HTTPS}/stories`, formData)
      .pipe(
        catchError((error) => {
          console.error('Error creating story:', error);
          this.isLoading = false;
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Story created successfully:', data);
          this.dialogRef.close(data);
          this.isLoading = false;
          window.location.reload();
        },
        error: (error) => {
          console.error('Error:', error);
          this.isLoading = false;
        },
      });
  }

  // Close dialog
  onCancel() {
    this.dialogRef.close();
  }
}
