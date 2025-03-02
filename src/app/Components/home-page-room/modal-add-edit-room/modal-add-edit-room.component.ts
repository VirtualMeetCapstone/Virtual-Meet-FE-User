import {
  Component,
  EventEmitter,
  Input,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { RoomServicesService } from '../../../services/room-services.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-modal-add-edit-room',
  templateUrl: './modal-add-edit-room.component.html',
  styleUrl: './modal-add-edit-room.component.scss',
})
export class ModalAddEditRoomComponent {
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() roomToEdit: any = null;

  constructor(private roomService: RoomServicesService) {}
  FormAdd!: FormGroup;
  loading = false;

  ngOnInit(): void {
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
    const formValue = this.FormAdd.value;

    // Lấy file từ input (đúng cách)
    const fileInput = document.getElementById(
      'mediaUpload'
    ) as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      formValue.mediaUpload = fileInput.files[0]; // Lấy đúng file
    }

    console.log('Dữ liệu gửi:', formValue);
    this.loading = true;

    this.roomService.addRoom(formValue).subscribe((res: any) => {
      console.log('Response:', res);

      if (res.id) {
        this.closeModal.emit(true);
      }
      this.loading = false;
    });
  }
  onUpdateRoom() {
    const formValue = this.FormAdd.value;

    // Lấy file từ input
    const fileInput = document.getElementById(
      'mediaUpload'
    ) as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      formValue.mediaUpload = fileInput.files[0];
    } else {
      formValue.mediaUpload =
        this.roomToEdit?.medias?.length > 0
          ? this.roomToEdit.medias[0].url
          : null;
    }

    console.log('Dữ liệu gửi:', formValue);
    this.loading = true;

    this.roomService
      .updateRoom(this.roomToEdit.id, formValue)
      .subscribe((res: any) => {
        console.log('Response:', res);
        if (res.success) {
          this.closeModal.emit(true);
        }
        this.loading = false;
      });
  }
}
