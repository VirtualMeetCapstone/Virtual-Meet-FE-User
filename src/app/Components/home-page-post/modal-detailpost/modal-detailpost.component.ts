import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PostserviceService } from '../../../services/post-service/postservice.service';

@Component({
  selector: 'app-modal-detailpost',
  templateUrl: './modal-detailpost.component.html',
  styleUrls: ['./modal-detailpost.component.scss'],
})
export class ModalDetailpostComponent {
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() post: any = null;
  currentImageIndex: number = 0;
  comments: any = [];
  groupedComments: any = {};

  constructor(private postService: PostserviceService) {}

  ngOnInit(): void {
    this.postService.getComment(this.post.id).subscribe((data: any) => {
      this.comments = data;
      console.log(this.comments);
      this.groupedComments = this.groupComments(this.comments);
      console.log('grouo', this.groupedComments);
    });
  }
  groupComments(comments: any) {
    let grouped: any = {};

    // Lấy danh sách comments từ `comments.data`, đảm bảo nó là mảng
    const commentArray = comments?.data || [];

    commentArray.forEach((comment: any) => {
      if (!comment.parentId) {
        grouped[comment.id] = { ...comment, replies: [] };
      }
    });

    commentArray.forEach((comment: any) => {
      if (comment.parentId && grouped[comment.parentId]) {
        grouped[comment.parentId].replies.push(comment);
      }
    });

    return Object.values(grouped);
  }

  onCloseModal() {
    this.closeModal.emit(false);
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.post.medias.length - 1) {
      this.currentImageIndex++;
    }
  }
}
