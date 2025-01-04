import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.scss',
})
export class LoginModalComponent {
  @Input() isShowLoginDialog: boolean = false;
  @Output() openLoginDialog = new EventEmitter();

  onClickLoginDialog() {
    this.isShowLoginDialog = !this.isShowLoginDialog;
    this.openLoginDialog.emit(this.isShowLoginDialog);
  }
}
