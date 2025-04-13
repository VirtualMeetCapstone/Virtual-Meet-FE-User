import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PostserviceService } from '../../../services/post-service/postservice.service';

@Component({
  selector: 'app-modal-delete-post',
  templateUrl: './modal-delete-post.component.html',
  styleUrl: './modal-delete-post.component.scss',
})
export class ModalDeletePostComponent {
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() post: any = null;
  constructor(private postSevice: PostserviceService) {}

  ngOnInit(): void {}

  onCloseModal() {
    this.closeModal.emit(false);
  }
  onDeletePost() {
    this.postSevice.deletePost(this.post.id).subscribe((res: any) => {
      console.log(res);
      this.closeModal.emit(true);
    });
  }
}
