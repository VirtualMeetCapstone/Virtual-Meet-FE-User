import { Component, OnInit } from '@angular/core';
import { PostserviceService } from '../../services/post-service/postservice.service';

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

  constructor(private postService: PostserviceService) {}

  ngOnInit(): void {
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
}
