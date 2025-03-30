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

  listPost: any[] = [];
  totalPost: number | null = null; // Để kiểm tra khi chưa load xong
  pageSize: number = 9;
  skip: number = 0;
  loading: boolean = false;

  userId: string = '';
  user: any = null;

  isShowModalDetailPost = false;
  post: any = null;
  isLoading: boolean = false;
  id: string = '';

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
            console.log('userfull', user);
            this.user = user;
          });
      }
    });

    this.loadMorePosts();
    this.notifyService.onOpenPostModal().subscribe((postId) => {
      this.openModalDetailPost(postId);
    });
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
      this.listPost = [...this.listPost, ...data.data];

      if (this.totalPost === null) {
        this.totalPost = data.totalCount;
      }

      this.skip += this.pageSize;
      this.loading = false;
    });
  }

  openModalDetailPost(postId: string) {
    console.log('user when openmodal', this.user);
    this.isLoading = true;
    this.postService.getPostById(postId).subscribe((data: any) => {
      this.post = data;
      this.isShowModalDetailPost = true;
      this.isLoading = false;
    });
  }

  closeModalDetailPost() {
    this.isShowModalDetailPost = false;
  }

  createPost() {}

  createFeeling() {}

  tagFriend() {}

  openCreatePost() {
    const dialogRef = this.dialog.open(CreatePostModalComponent, {
      width: '500px',
      data: {
        id: this.userId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('New story added:', result);
      }
    });
  }

  getSafeUrl(url: any) {
    return this.externalService.getSafeUrl(url); // Gọi từ service
  }
}
