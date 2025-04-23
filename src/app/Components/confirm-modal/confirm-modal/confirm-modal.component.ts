import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  @Input() visible = false;
  @Input() message = 'Xác nhận?';
  @Output() confirmed = new EventEmitter<boolean>();

  confirm() {
    this.visible = false;
    this.confirmed.emit(true);
  }

  cancel() {
    this.visible = false;
    this.confirmed.emit(false);
  }
}
