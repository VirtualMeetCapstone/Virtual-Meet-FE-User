import {Component, OnInit} from '@angular/core';
import {PostserviceService} from '../../services/post-service/postservice.service';
import {MatDialog} from '@angular/material/dialog';
import {CreatePostModalComponent} from '../create-post-modal/create-post-modal.component';
import {AuthService} from '../../services/auth-service/auth.service';
import {ExternalServiceService} from '../../services/external-service/external-service.service';

@Component({
  selector: 'app-home-page-post',
  templateUrl: './home-page-post.component.html',
  styleUrls: ['./home-page-post.component.scss'],
})
export class HomePagePostComponent implements OnInit {
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
  ) {
  }

  ngOnInit(): void {

    this.authService.loggedIn$.subscribe((status: boolean) => {
      if (status) {
        this.user = this.authService.getUser();
        this.id = this.userId;
        this.user = this.authService.getBackendUser(this.id);
      }
    });
    console.log("ra coi",this.user.name);
    if (this.authService.isLoggedIn()) {
      this.user = this.authService.getUser();


    }
    this.loadMorePosts();
  }

  loadMorePosts() {
    if (
      this.loading ||
      (this.totalPost !== null && this.listPost.length >= this.totalPost)
    ) {
      return;
    }

    this.loading = true;
    this.postService
      .getPosts(this.pageSize, this.skip)
      .subscribe((data: any) => {
        this.listPost = [...this.listPost, ...data.data];
        this.totalPost = data.totalCount;
        this.skip += this.pageSize;
        this.loading = false;
      });
  }

  openModalDetailPost(postId: string) {
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

  createPost() {
  }

  createFeeling() {
  }

  tagFriend() {
  }

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
