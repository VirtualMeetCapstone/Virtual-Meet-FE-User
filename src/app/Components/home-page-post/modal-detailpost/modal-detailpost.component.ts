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
  @Output() postUpdated = new EventEmitter<any>(); // Emit updates to home page
  @Input() post: any = null;
  @Input() user: any = '';
  @Input() userId: any = '';

  currentImageIndex: number = 0;
  comments: any = [];
  groupedComments: any = {};
  isLoadingComment: boolean = false;
  messages: any = [];
  isLoadingPost: boolean = false;
  showReactionPanel: boolean = false; // Toggle reaction panel

  constructor(
    private postService: PostserviceService,
    private externalService: ExternalServiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId && !this.post) {
      this.isLoadingPost = true;
      this.postService.getPostById(postId).subscribe(
        (data: any) => {
          this.post = data;
          this.updatePostReactions(); // Fetch latest reactions
          this.getComment();
          this.isLoadingPost = false;
        },
        (error: any) => {
          this.notifyError('Error loading post details');
          this.isLoadingPost = false;
        }
      );
    } else {
      this.updatePostReactions(); // Refresh reactions even if post is provided
      this.getComment();
    }
  }

  // Toggle reaction panel visibility
  toggleReactionPanel(event: Event) {
    event.stopPropagation();
    this.showReactionPanel = !this.showReactionPanel;
  }

  // Set a reaction and update reactions
  setReaction(reactionType: string, event: Event) {
    event.stopPropagation();
    const reactionTypeNumber = this.mapReactionTypeToNumber(reactionType);
    this.postService
      .setReaction(this.post.id, reactionTypeNumber)
      .subscribe(() => {
        this.updatePostReactions();
      });
    this.showReactionPanel = false;
  }

  // Update likeCount and currentUserReaction, then emit to home page
  updatePostReactions() {
    this.postService
      .getUserReactions(this.post.id)
      .subscribe((reactions: any) => {
        this.post.likeCount = reactions.data ? reactions.data.length : 0;
        const userReaction = reactions.data.find(
          (r: any) => r.id === this.userId
        );
        this.post.currentUserReaction = userReaction
          ? this.mapReactionNumberToType(userReaction.reactionType)
          : null;
        // Notify home page of the update
        this.postUpdated.emit({
          id: this.post.id,
          likeCount: this.post.likeCount,
          currentUserReaction: this.post.currentUserReaction,
        });
      });
  }

  // Map reaction type to number (consistent with home page)
  mapReactionTypeToNumber(type: string): number {
    const map: { [key: string]: number } = {
      like: 0,
      haha: 1,
      wow: 2,
      sad: 3,
      angry: 4,
    };
    return map[type] || 0;
  }

  // Map reaction number to type (consistent with home page)
  mapReactionNumberToType(number: number): string {
    const map: { [key: number]: string } = {
      0: 'like',
      1: 'haha',
      2: 'wow',
      3: 'sad',
      4: 'angry',
    };
    return map[number] || 'like';
  }

  // Existing methods (getComment, groupComments, etc.) remain unchanged
  getComment() {
    if (!this.post?.id) return;
    this.isLoadingComment = true;
    this.postService.getComment(this.post.id).subscribe((data: any) => {
      this.comments = data;
      this.groupedComments = this.groupComments(this.comments);
      this.isLoadingComment = false;
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
        () => this.getComment(),
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
        () => this.getComment(),
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
