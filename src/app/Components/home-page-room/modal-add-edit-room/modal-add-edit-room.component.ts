import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth-service/auth.service';
import { RoomServicesService } from '../../../services/room-service/room-services.service';

@Component({
  selector: 'app-modal-add-edit-room',
  templateUrl: './modal-add-edit-room.component.html',
  styleUrls: ['./modal-add-edit-room.component.scss'],
})
export class ModalAddEditRoomComponent implements OnInit {
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() roomToEdit: any = null;
  imagePreview: string | ArrayBuffer | null = null;
  @Input() userId: any = null;

  constructor(
    private roomService: RoomServicesService,
    private cdRef: ChangeDetectorRef
  ) {}
  FormAdd!: FormGroup;
  loading = false;
  isPublic = true;
  showPasswordError = false;
  password: string = '';
  isUpdate: boolean = false;
  togglePrivacy() {
    this.isPublic = !this.isPublic;
    this.password = '';
  }

  ngOnInit(): void {
    console.log(this.userId);
    if (this.roomToEdit == null) {
      this.isUpdate = false;
      this.FormAdd = new FormGroup({
        topic: new FormControl('', Validators.required),
        description: new FormControl(''),
        maximumMember: new FormControl('', Validators.required),
      });
    } else {
      this.isUpdate = true;
      console.log('room to edit from modal', this.roomToEdit);

      this.FormAdd = new FormGroup({
        topic: new FormControl(this.roomToEdit.topic, Validators.required),
        description: new FormControl(this.roomToEdit.description),
        maximumMember: new FormControl(this.roomToEdit.maximumMembers),
      });
      if (this.roomToEdit.privacy == 1) {
        this.isPublic = false;
      }
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
    formValue.mediaUpload = this.imagePreview;

    this.roomService.addRoom(formValue, this.userId, this.password).subscribe(
      (res: any) => {
        console.log('Response:', res);
        if (res.id) {
          this.closeModal.emit(true);
          this.roomService.triggerRefresh();
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
      .updateRoom(
        this.roomToEdit.id,
        formValue,
        this.userId,
        !this.isPublic,
        this.password
      )
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
    this.loading = true;
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.cdRef.detectChanges();
      };
      reader.readAsDataURL(file);

      this.roomService.uploadMedia(file).subscribe(
        (res: any) => {
          console.log('Upload thành công:', res);
          this.imagePreview = res[0].url;
          this.loading = false;
          this.cdRef.detectChanges();
          console.log('imagePreview', this.imagePreview);
        },
        (error) => {
          console.error('Lỗi upload:', error);
          this.loading = false;
          this.cdRef.detectChanges();
        }
      );
    }
  }
  onPasswordInput() {
    if (this.isUpdate) {
      return;
    }
    const trimmed = (this.password || '').trim();
    this.showPasswordError = !this.isPublic && !trimmed;
  }

  checkTopic(topic: string) {
    if (topic) {
      console.log('Checking topic:', topic);
      this.roomService.checkInput(topic).subscribe({
        next: (response) => {
          console.log('Response from API:', response);
          if (response.status) {
            this.FormAdd.get('topic')?.setErrors({ invalid: true });
          } else {
            this.FormAdd.get('topic')?.setErrors(null);
          }
        },
        error: (err) => {
          console.error('Error checking topic:', err);
        },
      });
    }
  }

  checkDescription(description: string) {
    if (description) {
      console.log('Checking description:', description);
      this.roomService.checkInput(description).subscribe({
        next: (response) => {
          console.log('Response from API:', response);
          if (response.status) {
            this.FormAdd.get('description')?.setErrors({ invalid: true });
          } else {
            this.FormAdd.get('description')?.setErrors(null);
          }
        },
        error: (err) => {
          console.error('Error checking description:', err);
        },
      });
    }
  }
}
