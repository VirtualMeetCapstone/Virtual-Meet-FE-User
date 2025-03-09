import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageRoomComponent } from './Components/home-page-room/home-page-room.component';
import { MyProfileComponent } from './Components/my-profile/my-profile.component';
import { HomePagePostComponent } from './Components/home-page-post/home-page-post.component';
import { YoutubePlayerComponent } from './Components/youtube-player/youtube-player.component';
import { NewsFeedMyProfileComponent } from './Components/news-feed-my-profile/news-feed-my-profile.component';
import { RoomComponentComponent } from './Components/room-component/room-component.component';

const routes: Routes = [
  { path: '', component: HomePageRoomComponent },
  { path: 'my-profile/:id', component: MyProfileComponent },
  {
    path: 'my-profile/:id/news-feed-my-profile',
    component: NewsFeedMyProfileComponent,
  },
  { path: 'posts', component: HomePagePostComponent },
  { path: 'video', component: YoutubePlayerComponent },
  { path: 'room', component: RoomComponentComponent },
  { path: 'room/:roomId', component: RoomComponentComponent },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
