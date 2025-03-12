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
  @Input() user: any = '';
  currentImageIndex: number = 0;
  comments: any = [];
  groupedComments: any = {};
  isLoadingComment: boolean = false;
  messages: any = [];
  constructor(private postService: PostserviceService) {}

  ngOnInit(): void {
    console.log(this.user);
    this.getComment();
  }
  getComment() {
    this.isLoadingComment = true;
    this.postService.getComment(this.post.id).subscribe((data: any) => {
      this.comments = data;
      this.groupedComments = this.groupComments(this.comments);
      this.isLoadingComment = false;
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
  addComment(content: string) {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      this.notifyError('The content of comment is required !!!');
      return;
    }

    this.postService
      .commentPost(this.user.id, this.post.id, trimmedContent)
      .subscribe(
        (newComment: any) => {
          this.getComment();
        },
        (error: any) => {
          this.notifyError('Error To Comment !!!');
        }
      );
  }
  replyComment(parentId: string, content: string) {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      this.notifyError('The content of comment is required !!!');
      return;
    }

    this.postService
      .replyComment(this.user.id, this.post.id, parentId, trimmedContent)
      .subscribe(
        (newComment: any) => {
          this.getComment();
        },
        (error: any) => {
          this.notifyError('Error To Comment !!!');
        }
      );
  }
  notifyError(messsage: string) {
    this.messages.push(messsage);
    setTimeout(() => {
      this.messages = [];
    }, 3000);
    return;
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
