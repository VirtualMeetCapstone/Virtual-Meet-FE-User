import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrl: './room-component.component.scss'
})
export class RoomComponentComponent implements OnInit {
  isParticipantsOpen = false;

  isChatOpen = false;
  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  toggleParticipants() {
    this.isParticipantsOpen = !this.isParticipantsOpen;
  }
  toggleClose()
  {
    this.isChatOpen = false;
    this.isParticipantsOpen = false;
  }

  ngOnInit(): void {

  }

}
