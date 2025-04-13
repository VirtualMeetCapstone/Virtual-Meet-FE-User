import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PostserviceService } from '../../services/post-service/postservice.service';
import { MatDialog } from '@angular/material/dialog';
import { CreatePostModalComponent } from '../create-post-modal/create-post-modal.component';
import { AuthService } from '../../services/auth-service/auth.service';
import { ExternalServiceService } from '../../services/external-service/external-service.service';
import { NotificationServiceService } from '../../services/notification-service/notification-service.service';

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
  showReactionPanelForPostId: string | null = null;
  openedMenuPostId: number | null = null;

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
    this.showReactionPanelForPostId =
      this.showReactionPanelForPostId === postId ? null : postId;
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
        post.likeCount = reactions.data ? reactions.data.length : 0;
        const userReaction = reactions.data.find(
          (r: any) => r.id === this.userId
        );
        post.currentUserReaction = userReaction
          ? this.mapReactionNumberToType(userReaction.reactionType)
          : null;
        this.listPost = [...this.listPost];
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

  pauseAllVideos() {
    const videos = document.querySelectorAll<HTMLVideoElement>(
      '.main-content .post video'
    );
    console.log('Số lượng video tìm thấy:', videos.length);
    videos.forEach((video, index) => {
      if (video.readyState >= 2) {
        video.pause();
        console.log(`Đã tạm dừng video ${index}`);
      } else {
        video.addEventListener(
          'canplay',
          () => {
            video.pause();
            console.log(`Đã tạm dừng video ${index} sau khi sẵn sàng`);
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
