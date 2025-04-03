import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PostserviceService } from '../../../services/post-service/postservice.service';
import { ExternalServiceService } from '../../../services/external-service/external-service.service';
import { ActivatedRoute, Router } from '@angular/router';

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
  isLoadingPost: boolean = false;

  constructor(
    private postService: PostserviceService,
    private externalService: ExternalServiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId && !this.post) {
      // Fetch post data if not provided via @Input
      this.isLoadingPost = true;
      this.postService.getPostById(postId).subscribe(
        (data: any) => {
          this.post = data;
          this.isLoadingPost = false;
          this.getComment();
        },
        (error: any) => {
          this.notifyError('Error loading post details');
          this.isLoadingPost = false;
        }
      );
    } else {
      this.getComment(); // If post is provided via @Input, just load comments
    }
    console.log('userfullfrommodaldetail', this.user);
    console.log(this.userId);
  }

  getComment() {
    if (!this.post?.id) return; // Ensure post is loaded
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
      grouped[comment.id] = { ...comment, replies: [] };
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
        (newComment: any) => this.getComment(),
        (error: any) => this.notifyError('Error To Comment !!!')
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
        (newComment: any) => this.getComment(),
        (error: any) => this.notifyError('Error To Comment !!!')
      );
  }

  notifyError(message: string) {
    this.messages.push(message);
    setTimeout(() => (this.messages = []), 3000);
  }

  onCloseModal() {
    this.closeModal.emit(false);
    this.router.navigate(['/posts']);
  }

  prevImage() {
    if (this.currentImageIndex > 0) this.currentImageIndex--;
  }

  nextImage() {
    if (this.currentImageIndex < this.post?.medias?.length - 1)
      this.currentImageIndex++;
  }

  getSafeUrl(url: any) {
    return this.externalService.getSafeUrl(url);
  }
}
