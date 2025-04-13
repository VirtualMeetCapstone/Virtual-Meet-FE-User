import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PostserviceService } from '../../services/post-service/postservice.service';
import { MatDialog } from '@angular/material/dialog';
import { CreatePostModalComponent } from '../create-post-modal/create-post-modal.component';
import { AuthService } from '../../services/auth-service/auth.service';
import { ExternalServiceService } from '../../services/external-service/external-service.service';
import { NotificationServiceService } from '../../services/notification-service/notification-service.service';
import { ReactionSummaryComponent } from '../reaction-summary/reaction-summary.component';

@Component({
  selector: 'app-home-page-post',
  templateUrl: './home-page-post.component.html',
  styleUrls: ['./home-page-post.component.scss'],
})
export class HomePagePostComponent implements OnInit {
  @Output() openPostModal = new EventEmitter<string>();
  comments: any = [];
  listPost: any[] = [];
  totalPost: number | null = null;
  pageSize: number = 9;
  skip: number = 0;
  loading: boolean = false;
  showModalDeletePost: boolean = false;

  userId: string = '';
  user: any = null;
  postToDelete: string = '';
  isShowModalDetailPost = false;
  post: any = null;
  isLoading: boolean = false;
  openedMenuPostId: number | null = null;

  showReactionPanelForPostId: string | null = null;

  toggleMenu(postId: number, event: MouseEvent) {
    event.stopPropagation(); // tránh trigger openModalDetailPost
    this.openedMenuPostId = this.openedMenuPostId === postId ? null : postId;
  }

  reportPost(postId: number) {
    // Xử lý report
    console.log('Report post', postId);
    this.openedMenuPostId = null;
  }

  constructor(
    private postService: PostserviceService,
    private authService: AuthService,
    private dialog: MatDialog,
    private externalService: ExternalServiceService,
    private notifyService: NotificationServiceService
  ) {}

  ngOnInit(): void {
    this.authService.loggedIn$.subscribe((status: boolean) => {
      if (status) {
        this.user = this.authService.getUser();
        this.userId = this.user.id;
        this.authService
          .getFullInformationOfUseById(this.user.id)
          .subscribe((user: any) => {
            this.user = user;
          });
      }
    });
    this.loadMorePosts();
    this.addPlayListeners();
    this.notifyService.onOpenPostModal().subscribe((postId) => {
      this.openModalDetailPost(postId);
    });
  }
  openModalDeletePost(post: any) {
    this.postToDelete = post;
    this.showModalDeletePost = true;
  }

  addPlayListeners() {
    const videos = document.querySelectorAll<HTMLVideoElement>('.post video');
    videos.forEach((video) => {
      video.addEventListener('play', () => {
        if (this.isShowModalDetailPost) {
          video.pause(); // Tạm dừng video nếu modal đang mở
        }
      });
    });
  }
  closeModalDeletePost(event: any) {
    if (!event) {
      this.showModalDeletePost = false;
    } else {
      this.showModalDeletePost = false;
      this.skip = 0;
      this.listPost = [];
      this.loadMorePosts();
    }
  }
  loadMorePosts() {
    if (
      this.loading ||
      (this.totalPost !== null && this.listPost.length >= this.totalPost)
    ) {
      return;
    }
    this.loading = true;
    const apiCall =
      this.totalPost === null
        ? this.postService.getPosts(this.pageSize, this.skip)
        : this.postService.getPostsNotNeedTotalCount(this.pageSize, this.skip);
    apiCall.subscribe((data: any) => {
      const newPosts = data.data.map((post: any) => ({
        ...post,
        topReactions: [],
        totalReactions: 0,
        currentUserReaction: null,
      }));
      this.listPost = [...this.listPost, ...newPosts];
      if (this.totalPost === null) {
        this.totalPost = data.totalCount;
      }
      this.skip += this.pageSize;
      this.loading = false;
      this.updateAllPostReactions();
    });
  }

  toggleReactionPanel(postId: string, event: Event) {
    event.stopPropagation();
    if (this.showReactionPanelForPostId === postId) {
      this.showReactionPanelForPostId = null;
    } else {
      this.showReactionPanelForPostId = postId;
    }
  }

  getReactionColor(type: string): string {
    const colors: { [key: string]: string } = {
      like: '#007bff', // blue
      love: '#e91e63', // pink
      haha: '#ffca28', // yellow
      wow: '#ffeb3b', // light yellow
      sad: '#90caf9', // light blue
      angry: '#f44336', // red
    };
    return colors[type] || '#606770'; // default gray
  }

  setReaction(postId: string, reactionType: string, event: Event) {
    event.stopPropagation();
    const reactionTypeNumber = this.mapReactionTypeToNumber(reactionType);
    this.postService.setReaction(postId, reactionTypeNumber).subscribe(() => {
      this.updatePostReactions(postId);
    });
    this.showReactionPanelForPostId = null;
  }

  updatePostReactions(postId: string) {
    this.postService.getUserReactions(postId).subscribe((reactions: any) => {
      const post = this.listPost.find((p) => p.id === postId);
      if (post) {
        post.reactionCounts = reactions.counts; // Số lượng từng loại phản ứng
        post.topReactions = reactions.topReactions; // 3 phản ứng phổ biến nhất
        post.likeCount = reactions.totalCount; // Tổng số phản ứng
        post.reactionsData = reactions.data; // Lưu danh sách người dùng để dùng trong pop-up
        const userReaction = reactions.data.find(
          (r: any) => r.id === this.userId
        );
        post.currentUserReaction = userReaction
          ? this.mapReactionNumberToType(userReaction.reactionType)
          : null;
        this.listPost = [...this.listPost]; // Trigger cập nhật UI
      }
    });
  }

  updatePostInList(updatedData: any) {
    const post = this.listPost.find((p) => p.id === updatedData.id);
    if (post) {
      post.likeCount = updatedData.likeCount;
      post.currentUserReaction = updatedData.currentUserReaction;
      this.listPost = [...this.listPost];
    }
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

  updateAllPostReactions() {
    this.listPost.forEach((post) => this.updatePostReactions(post.id));
  }

  openReactionSummary(postId: string, event: Event) {
    event.stopPropagation();
    const post = this.listPost.find((p) => p.id === postId);
    if (post && post.reactionCounts) {
      this.dialog.open(ReactionSummaryComponent, {
        width: '300px',
        data: {
          reactionCounts: post.reactionCounts,
          postId,
          users: post.reactionsData, // Truyền danh sách người dùng đã phản ứng
        },
      });
    }
  }

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

  pauseAllVideos() {
    const videos = document.querySelectorAll<HTMLVideoElement>(
      '.main-content .post video'
    );
    videos.forEach((video, index) => {
      if (video.readyState >= 2) {
        video.pause();
      } else {
        video.addEventListener(
          'canplay',
          () => {
            video.pause();
          },
          { once: true }
        );
      }
    });
  }

  openModalDetailPost(postId: string) {
    this.pauseAllVideos();
    this.disableVideoInteraction();
    this.openedMenuPostId = null;
    this.isLoading = true;
    this.postService.getPostById(postId).subscribe((data: any) => {
      this.post = data;
      this.isShowModalDetailPost = true;
      this.isLoading = false;
    });
  }

  closeModalDetailPost() {
    this.isShowModalDetailPost = false;
    this.enableVideoInteraction();
  }

  openCreatePost() {
    const dialogRef = this.dialog.open(CreatePostModalComponent, {
      width: '500px',
      data: { id: this.userId },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('New post added:', result);
      }
    });
  }

  createFeeling() {}
  tagFriend() {}
  getSafeUrl(url: any) {
    return this.externalService.getSafeUrl(url);
  }

  // Thêm phương thức để xác định class cho post-images
  getMediaClass(count: number): string {
    if (count === 1) return 'one';
    if (count === 2) return 'two';
    if (count >= 3) return 'three-plus';
    return '';
  }

  // Focus vào input comment (mở modal detail post)
  focusCommentInput(postId: string) {
    this.openModalDetailPost(postId); // Gọi hàm mở modal chi tiết bài post
  }

  // Share bài post
  sharePost(postId: string) {
    // Logic để share bài post, ví dụ: mở modal share hoặc sao chép link
    console.log('Share post', postId);
  }

  disableVideoInteraction() {
    const videos = document.querySelectorAll<HTMLVideoElement>('.post video');
    videos.forEach((video) => {
      video.classList.add('video-disabled'); // Thêm lớp vô hiệu hóa
      video.pause(); // Đảm bảo video được tạm dừng
    });
  }

  enableVideoInteraction() {
    const videos = document.querySelectorAll<HTMLVideoElement>('.post video');
    videos.forEach((video) => {
      video.classList.remove('video-disabled'); // Xóa lớp vô hiệu hóa
    });
  }
}
