import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageRoomComponent } from './Components/home-page-room/home-page-room.component';
import { MyProfileComponent } from './Components/my-profile/my-profile.component';
import { HomePagePostComponent } from './Components/home-page-post/home-page-post.component';
import { YoutubePlayerComponent } from './Components/youtube-player/youtube-player.component';
const routes: Routes = [
  { path: '', component: HomePageRoomComponent },
  { path: 'my-profile/:id', component: MyProfileComponent },
  { path: 'posts', component: HomePagePostComponent },
  { path: 'video', component: YoutubePlayerComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
