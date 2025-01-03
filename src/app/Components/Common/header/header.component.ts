import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isShowDropdown: boolean = false;
  onClickDropdown() {
    this.isShowDropdown = !this.isShowDropdown;
  }
}
