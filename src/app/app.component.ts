import { Component } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Virtual-Meet-FE';
  isHiddenSidebar = false;
  onClickSideBar() {
    this.isHiddenSidebar = !this.isHiddenSidebar;
  }
}
