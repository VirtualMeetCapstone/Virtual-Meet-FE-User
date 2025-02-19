import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageRoomComponent } from './Components/home-page-room/home-page-room.component';
import { MyProfileComponent } from './Components/my-profile/my-profile.component';

const routes: Routes = [
  { path: '', component: HomePageRoomComponent },
  { path: 'my-profile/:id', component: MyProfileComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
