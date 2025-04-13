import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-modal-enterpassforroomprivate',
  templateUrl: './modal-enterpassforroomprivate.component.html',
  styleUrl: './modal-enterpassforroomprivate.component.scss',
})
export class ModalEnterpassforroomprivateComponent {
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() room: any = null;
  password: string = '';
  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log(this.room);
  }
  async joinRoom() {
    const timestamp = Date.now();
    this.router.navigate(['/room', '3aa433fc-0390-444d-9e7c-929f88a07fd1'], {
      queryParams: { timestamp, password: this.password },
    });
  }
  onCloseModal() {
    this.closeModal.emit(false);
  }
}
