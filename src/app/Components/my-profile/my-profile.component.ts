import { Component } from '@angular/core';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css'],
})
export class MyProfileComponent {
  isEditing = false;
  user = {
    username: 'cmnho1',
    bio: 'Chào mừng bạn đến với trang cá nhân của tôi!',
    avatar:
      'https://storage.googleapis.com/a1aa/image/TfNmA7Vgw-zJGccK-UWYT8GHYlOYJ2yaNRjCJvYY2eM.jpg',
  };

  openEditProfile() {
    this.isEditing = true;
  }

  closeEditProfile() {
    this.isEditing = false;
  }
}
