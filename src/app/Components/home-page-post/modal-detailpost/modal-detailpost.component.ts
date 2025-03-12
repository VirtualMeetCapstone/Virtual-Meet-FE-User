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
    let grouped: Record<string, any> = {};

    const commentArray = comments?.data || [];

    commentArray.forEach((comment: any) => {
      grouped[comment.id] = { ...comment, replies: [] };
    });

    let result: any = [];

    commentArray.forEach((comment: any) => {
      if (comment.parentId) {
        if (grouped[comment.parentId]) {
          grouped[comment.parentId].replies.push(grouped[comment.id]);
        }
      } else {
        result.push(grouped[comment.id]); // Nếu không có parentId, là comment gốc
      }
    });

    return result;
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
