import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RoomServicesService } from '../../../services/room-service/room-services.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth-service/auth.service';
@Component({
  selector: 'app-modal-add-edit-room',
  templateUrl: './modal-add-edit-room.component.html',
  styleUrl: './modal-add-edit-room.component.scss',
})
export class ModalAddEditRoomComponent {
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() roomToEdit: any = null;
  imagePreview: string | ArrayBuffer | null = null;
  @Input() userId: any = null;

  constructor(private roomService: RoomServicesService) {}
  FormAdd!: FormGroup;
  loading = false;
  isPublic = true;

  togglePrivacy() {
    this.isPublic = !this.isPublic;
  }

  ngOnInit(): void {
    console.log(this.userId);
    if (this.roomToEdit == null) {
      this.FormAdd = new FormGroup({
        topic: new FormControl('', Validators.required),
        description: new FormControl('', Validators.required),
        maximumMember: new FormControl('', Validators.required),
        mediaUpload: new FormControl(''),
      });
    } else {
      console.log('room to edit from modal', this.roomToEdit);

      this.FormAdd = new FormGroup({
        topic: new FormControl(this.roomToEdit.topic, Validators.required),
        description: new FormControl(this.roomToEdit.description),
        maximumMember: new FormControl(this.roomToEdit.maximumMembers),
        mediaUpload: new FormControl(''),
      });
    }
  }

  onCloseModal() {
    this.closeModal.emit(false);
    this.FormAdd.reset();
    this.roomToEdit = null;
  }
  onDeleteRoom() {}
  onAddRoom() {
    this.loading = true;
    const formValue = this.FormAdd.value;
    formValue.mediaUpload = this.imagePreview; // Dùng link ảnh đã upload

    this.roomService.addRoom(formValue, this.userId).subscribe(
      (res: any) => {
        console.log('Response:', res);
        if (res.id) {
          this.closeModal.emit(true);
        }
        this.loading = false;
      },
      (error: any) => {
        console.error('Lỗi tạo phòng:', error);
        this.loading = false;
      }
    );
  }

  onUpdateRoom() {
    this.loading = true;
    const formValue = this.FormAdd.value;
    formValue.mediaUpload =
      this.imagePreview || this.roomToEdit?.medias?.[0]?.url;

    this.roomService
      .updateRoom(this.roomToEdit.id, formValue, this.userId)
      .subscribe(
        (res: any) => {
          console.log('Response:', res);
          if (res.success) {
            this.closeModal.emit(true);
          }
          this.loading = false;
        },
        (error: any) => {
          console.error('Lỗi cập nhật phòng:', error);
          this.loading = false;
        }
      );
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.loading = true;
      this.roomService.uploadMedia(file).subscribe(
        (res: any) => {
          console.log('Upload thành công:', res);
          if (res.length > 0 && res[0].url) {
            this.imagePreview = res[0].url;
            this.loading = false;
          }
        },
        (error) => {
          console.error('Lỗi upload:', error);
          this.loading = false;
        }
      );
    }
  }
}
