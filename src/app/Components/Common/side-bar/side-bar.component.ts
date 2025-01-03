import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  @Output() hiddenSidebar = new EventEmitter();
  isShowSideBar: boolean = true;

  onHiddenSideBar() {
    this.isShowSideBar = !this.isShowSideBar;
    this.hiddenSidebar.emit(this.isShowSideBar);
  }
}
