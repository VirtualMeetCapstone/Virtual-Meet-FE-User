import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-edit-profile-dialog',
  templateUrl: './edit-profile-dialog.component.html',
  styleUrls: ['./edit-profile-dialog.component.css'],
})
export class EditProfileDialogComponent implements OnChanges {
  @Input() username: string = '';
  @Input() bio: string = '';
  @Input() avatar: string = '';
  @Output() closeDialog = new EventEmitter<void>();

  newUsername: string = '';
  newBio: string = '';
  newAvatar: string = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['username']) this.newUsername = this.username;
    if (changes['bio']) this.newBio = this.bio;
    if (changes['avatar']) this.newAvatar = this.avatar;
  }

  onSave() {
    console.log('Profile Updated:', {
      username: this.newUsername,
      bio: this.newBio,
      avatar: this.newAvatar,
    });
    this.closeDialog.emit(); // Đóng hộp thoại sau khi lưu
  }

  onCancel() {
    this.closeDialog.emit(); // Đóng hộp thoại khi nhấn "Hủy"
  }
}
