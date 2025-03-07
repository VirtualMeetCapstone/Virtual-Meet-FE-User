import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AppConstants } from '../../constant/AppConstants';

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
  id: string;
  newUsername: string;
  newAvatar: File | null = null; // Sử dụng cho cả ảnh và video
  newContent: string = '';
  newMusicUrl: string = '';
  isLoading: boolean = false;
  // Sử dụng mediaPreview để chứa dữ liệu preview (ảnh hoặc video)
  mediaPreview: string | ArrayBuffer | null = null;
  // Biến mediaType xác định loại file: 'image' hoặc 'video'
  mediaType: string = '';

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
    const file = fileInput.files[0];
    this.newAvatar = file;

    // Xác định loại file dựa trên mime type
    if (file.type.startsWith('video')) {
      this.mediaType = 'video';
    } else if (file.type.startsWith('image')) {
      this.mediaType = 'image';
    } else {
      // Mặc định là ảnh nếu không xác định được
      this.mediaType = 'image';
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.mediaPreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  onSave() {
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

  onCancel() {
    this.dialogRef.close();
  }
}
