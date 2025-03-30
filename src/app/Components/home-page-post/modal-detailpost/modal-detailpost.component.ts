import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PostserviceService } from '../../../services/post-service/postservice.service';
import { ExternalServiceService } from '../../../services/external-service/external-service.service';
@Component({
  selector: 'app-modal-detailpost',
  templateUrl: './modal-detailpost.component.html',
  styleUrls: ['./modal-detailpost.component.scss'],
})
export class ModalDetailpostComponent implements OnInit {
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() post: any = null;
  @Input() user: any = '';
  @Input() userId: any = '';

  currentImageIndex: number = 0;
  comments: any = [];
  groupedComments: any = {};
  isLoadingComment: boolean = false;
  messages: any = [];
  constructor(
    private postService: PostserviceService,
    private externalService: ExternalServiceService
  ) {}

  ngOnInit(): void {
    console.log('userfullfrommodaldetail', this.user);
    console.log(this.userId);
    this.getComment();
  }
  getComment() {
    this.isLoadingComment = true;
    this.postService.getComment(this.post.id).subscribe((data: any) => {
      this.comments = data;
      console.log('commtent', this.comments);
      this.groupedComments = this.groupComments(this.comments);
      this.isLoadingComment = false;
      console.log('grouo', this.groupedComments);
    });
  }
  groupComments(comments: any) {
    let grouped: Record<string, any> = {};

    const commentArray = comments?.data || [];

    commentArray.forEach((comment: any) => {
      grouped[comment.id] = {
        ...comment,
        replies: [],
      };
    });

    let result: any = [];

    commentArray.forEach((comment: any) => {
      if (comment.parentId) {
        if (grouped[comment.parentId]) {
          grouped[comment.parentId].replies.push(grouped[comment.id]);
        }
      } else {
        result.push(grouped[comment.id]);
      }
    });
    result.forEach((comment: any) => {
      comment.replies.sort((a: any, b: any) => a.createTime - b.createTime);
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
      .commentPost(this.userId, this.post.id, trimmedContent)
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
      .replyComment(this.userId, this.post.id, parentId, trimmedContent)
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
  getSafeUrl(url: any) {
    return this.externalService.getSafeUrl(url); // Gọi từ service
  }
}
