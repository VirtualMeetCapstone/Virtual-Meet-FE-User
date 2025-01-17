import { Component } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isShowDropdown: boolean = false;
  isShowLoginDialog: boolean = false;
  isShowNotification: boolean = false;
  onClickDropdown() {
    this.isShowDropdown = !this.isShowDropdown;
  }
  onClickLoginDialog() {
    this.isShowLoginDialog = !this.isShowLoginDialog;
  }
  onClickNotification() {
    this.isShowNotification = !this.isShowNotification;
  }
}
