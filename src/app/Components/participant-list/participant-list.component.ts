import {Component, Input} from '@angular/core';
import {Participant} from "../../models/participant";

@Component({
  selector: 'app-participant-list',
  templateUrl: './participant-list.component.html',
  styleUrl: './participant-list.component.scss'
})
export class ParticipantListComponent {
  @Input() isParticipantsOpen = false;
  @Input() isHost = false;
  participants: Participant[] = [
    { id: 1, name: 'Nguyễn Văn A', avatar: 'assets/user1.jpg', muted: false, cameraOff: false },
    { id: 2, name: 'Trần Thị B', avatar: 'assets/user2.jpg', muted: true, cameraOff: true },
    { id: 3, name: 'Lê Văn C', avatar: 'assets/user3.jpg', muted: false, cameraOff: true }
  ];

  toggleParticipants() {
    this.isParticipantsOpen = !this.isParticipantsOpen;
  }

  toggleMute(user: Participant) {
    user.muted = !user.muted;
  }

  removeUser(user: Participant) {
    this.participants = this.participants.filter(p => p.id !== user.id);
  }
}
