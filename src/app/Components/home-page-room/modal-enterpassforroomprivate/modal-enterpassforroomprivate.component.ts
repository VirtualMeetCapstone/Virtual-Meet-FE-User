import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modal-enterpassforroomprivate',
  templateUrl: './modal-enterpassforroomprivate.component.html',
  styleUrl: './modal-enterpassforroomprivate.component.scss',
})
export class ModalEnterpassforroomprivateComponent {
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() roomId: string = '';
  password: string = '';
  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log(this.roomId);
  }
  async joinRoom() {
    const timestamp = Date.now();
    this.router.navigate(['/room', this.roomId], {
      queryParams: { timestamp, password: this.password },
    });
  }
  onCloseModal() {
    this.closeModal.emit(false);
  }
}
