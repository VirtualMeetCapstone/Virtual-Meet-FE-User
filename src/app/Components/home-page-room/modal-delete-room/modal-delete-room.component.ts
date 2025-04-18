import {
  Component,
  EventEmitter,
  Input,
  input,
  OnInit,
  Output,
} from '@angular/core';
import { RoomServicesService } from '../../../services/room-service/room-services.service';

@Component({
  selector: 'app-modal-delete-room',
  templateUrl: './modal-delete-room.component.html',
  styleUrl: './modal-delete-room.component.scss',
})
export class ModalDeleteRoomComponent implements OnInit {
  loading = false;
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() room: any = null;
  constructor(private roomService: RoomServicesService) {}

  ngOnInit(): void {
    console.log(this.room);
  }

  onCloseModal() {
    this.closeModal.emit(false);
  }
  onDeleteRoom() {
    this.loading = true;
    this.roomService.deleteRoom(this.room.id).subscribe((res: any) => {
      this.loading = false;
      this.closeModal.emit(true);
    });
  }
}
