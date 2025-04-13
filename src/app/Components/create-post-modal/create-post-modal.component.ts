import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { PostserviceService } from '../../services/post-service/postservice.service';

interface MediaPreview {
  type: 'image' | 'video';
  url: string | ArrayBuffer | null;
}

interface PostResponse {
  id: string;
  content: string;
  // Add other fields as needed
}

@Component({
  selector: 'app-create-post-modal',
  templateUrl: './create-post-modal.component.html',
  styleUrl: './create-post-modal.component.scss',
})
export class CreatePostModalComponent {
  id: string;
  newUsername: string;
  newContent: string = '';
  isLoading: boolean = false;
  selectedFiles: File[] = [];
  mediaPreviews: MediaPreview[] = [];
  privacy: number = 0;

  constructor(
    public dialogRef: MatDialogRef<CreatePostModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string; username: string },
    private http: HttpClient,
    private postService: PostserviceService
  ) {
    this.id = data.id;
    this.newUsername = data.username;
  }

  /** Xử lý khi chọn file ảnh/video */
  onPostMediaSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const files = Array.from(fileInput.files);
    this.selectedFiles.push(...files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.mediaPreviews.push({
          type: file.type.startsWith('video') ? 'video' : 'image',
          url: reader.result,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  /** Xóa ảnh/video khỏi danh sách */
  removeMedia(index: number) {
    this.selectedFiles.splice(index, 1);
    this.mediaPreviews.splice(index, 1);
  }

  /** Gửi bài viết */
  submitPost() {
    if (!this.newContent && this.selectedFiles.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn ảnh/video.');
      return;
    }

    this.isLoading = true;
    this.postService
      .createPost(this.newContent, this.privacy, undefined, this.selectedFiles)
      .subscribe({
        next: (response: any) => {
          // Explicitly typed as 'any'
          console.log('Bài viết đã được tạo:', response);
          this.dialogRef.close(response);
          this.isLoading = false;
          window.location.reload();
        },
        error: (error: any) => {
          // Explicitly typed as 'any'
          console.error('Lỗi khi tạo bài viết:', error);
          this.isLoading = false;
        },
      });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
