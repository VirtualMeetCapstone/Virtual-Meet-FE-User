import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { PostserviceService } from '../../services/post-service/postservice.service';
import { RoomServicesService } from '../../services/room-service/room-services.service';

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
  previousContent: string = ''; // Lưu nội dung trước đó để so sánh
  contentError: boolean = false; // Đánh dấu lỗi nội dung

  constructor(
    private postService: PostserviceService,
    public dialogRef: MatDialogRef<CreatePostModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string; username: string },
    private roomService: RoomServicesService
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

  /** Gọi khi người dùng rời khỏi trường nhập liệu */
  onContentBlur(): void {
    if (this.newContent && this.newContent !== this.previousContent) {
      this.previousContent = this.newContent; // Cập nhật nội dung trước đó
      this.checkContent(this.newContent);
    }
  }

  /** Kiểm tra nội dung bài viết */
  checkContent(content: string): void {
    if (content) {
      console.log('Checking content:', content);
      this.roomService.checkInput(content).subscribe({
        next: (response) => {
          console.log('Response from API:', response);
          if (response.status) {
            this.contentError = true; // Đánh dấu lỗi
          } else {
            this.contentError = false; // Xóa lỗi nếu hợp lệ
          }
        },
        error: (err) => {
          console.error('Error checking content:', err);
          alert('Đã xảy ra lỗi khi kiểm tra nội dung.');
        },
      });
    }
  }

  /** Gửi bài viết */
  submitPost() {
    if (!this.newContent && this.selectedFiles.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn ảnh/video.');
      return;
    }

    if (this.contentError) {
      alert('Nội dung bài viết chứa từ ngữ không phù hợp. Vui lòng chỉnh sửa.');
      return;
    }

    // Gửi bài viết nếu không có lỗi
    console.log('Submitting post:', this.newContent, this.selectedFiles);
    this.isLoading = true;
    this.postService.createPost(
      this.newContent,
      this.privacy,
      undefined,
      this.selectedFiles
    ).subscribe({
      next: (response) => {
        console.log('Bài viết đã được tạo:', response);
        this.dialogRef.close(response);
        this.isLoading = false;
        window.location.reload();
      },
      error: (error) => {
        console.error('Lỗi khi tạo bài viết:', error);
        this.isLoading = false;
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
