import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageRoomComponent } from './Components/home-page-room/home-page-room.component';
import { MyProfileComponent } from './Components/my-profile/my-profile.component';
import { ChatContainerComponent } from './Components/chat-container/chat-container.component';

const routes: Routes = [
  { path: '', component: HomePageRoomComponent },
  { path: 'my-profile', component: MyProfileComponent },
  { path: 'chat', component: ChatContainerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
