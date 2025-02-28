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
  constructor(private roomService: RoomServicesService) {}
  FormAdd!: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.FormAdd = new FormGroup({
      topic: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      maximumMember: new FormControl('', Validators.required),
      mediaUpload: new FormControl(''),
    });
  }

  onCloseModal() {
    this.closeModal.emit(false);
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
}
