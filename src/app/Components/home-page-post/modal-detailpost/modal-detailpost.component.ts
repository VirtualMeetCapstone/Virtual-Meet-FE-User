import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { PostserviceService } from '../../../services/post-service/postservice.service';
import { ExternalServiceService } from '../../../services/external-service/external-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactionSummaryComponent } from '../../reaction-summary/reaction-summary.component';
import { MatDialog } from '@angular/material/dialog';

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
  @ViewChild('commentInput') commentInput!: ElementRef;

  currentMediaIndex: number = 0;
  comments: any = [];
  groupedComments: any = {};
  isLoadingComment: boolean = false;
  messages: any = [];
  isLoadingPost: boolean = false;
  showReactionPanel: boolean = false; // Toggle reaction panel

  constructor(
    private postService: PostserviceService,
    private externalService: ExternalServiceService,
    private dialog: MatDialog,
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
        this.post.reactionCounts = reactions.counts;
        this.post.topReactions = reactions.topReactions;
        this.post.likeCount = reactions.totalCount;
        this.post.reactionsData = reactions.data;
        const userReaction = reactions.data.find(
          (r: any) => r.id === this.userId
        );
        this.post.currentUserReaction = userReaction
          ? this.mapReactionNumberToType(userReaction.reactionType)
          : null;
        this.postUpdated.emit({
          id: this.post.id,
          likeCount: this.post.likeCount,
          currentUserReaction: this.post.currentUserReaction,
          reactionCounts: this.post.reactionCounts,
          topReactions: this.post.topReactions,
          reactionsData: this.post.reactionsData,
        });
      });
  }

  openReactionSummary(event: Event) {
    event.stopPropagation();
    if (this.dialog.openDialogs.length === 0) {
      this.dialog.open(ReactionSummaryComponent, {
        width: '500px', // Điều chỉnh kích thước nếu cần
        data: {
          reactionCounts: this.post.reactionCounts,
          postId: this.post.id,
          users: this.post.reactionsData,
        },
        disableClose: false, // Cho phép đóng khi click ra ngoài
        panelClass: 'reaction-summary-dialog', // Thêm class để tùy chỉnh CSS nếu cần
      });
    }
  }

  // Map reaction type to number (consistent with home page)
  mapReactionTypeToNumber(type: string): number {
    const map: { [key: string]: number } = {
      like: 0,
      love: 1,
      haha: 2,
      wow: 3,
      sad: 4,
      angry: 5,
    };
    return map[type] || 0;
  }

  // Map reaction number to type (consistent with home page)
  mapReactionNumberToType(number: number): string {
    const map: { [key: number]: string } = {
      0: 'like',
      1: 'love',
      2: 'haha',
      3: 'wow',
      4: 'sad',
      5: 'angry',
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

  onCloseModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) return; // Close only if clicked outside modal-content
    this.closeModal.emit(false);
    this.router.navigate(['/posts']);
  }

  prevMedia() {
    if (this.currentMediaIndex > 0) this.currentMediaIndex--;
  }

  nextMedia() {
    if (this.currentMediaIndex < this.post?.medias?.length - 1)
      this.currentMediaIndex++;
  }

  getSafeUrl(url: any) {
    return this.externalService.getSafeUrl(url);
  }

  getReactionColor(type: string): string {
    const colors: { [key: string]: string } = {
      like: '#007bff',
      love: '#e91e63',
      haha: '#ffca28',
      wow: '#ffeb3b',
      sad: '#90caf9',
      angry: '#f44336',
    };
    return colors[type] || '#606770';
  }

  getReactionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      like: 'fas fa-thumbs-up',
      love: 'fas fa-heart',
      haha: 'fas fa-laugh',
      wow: 'fas fa-surprise',
      sad: 'fas fa-sad-tear',
      angry: 'fas fa-angry',
    };
    return icons[type] || 'fas fa-thumbs-up';
  }

  focusCommentInput() {
    if (this.commentInput) {
      this.commentInput.nativeElement.focus();
    }
  }

  // Share post (placeholder)
  sharePost() {
    // Chưa có logic cụ thể, có thể thêm sau
    console.log('Share post:', this.post.id);
  }
}
