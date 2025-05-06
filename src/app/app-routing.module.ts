import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageRoomComponent } from './Components/home-page-room/home-page-room.component';
import { MyProfileComponent } from './Components/my-profile/my-profile.component';
import { HomePagePostComponent } from './Components/home-page-post/home-page-post.component';
import { YoutubePlayerComponent } from './Components/youtube-player/youtube-player.component';
import { NewsFeedMyProfileComponent } from './Components/news-feed-my-profile/news-feed-my-profile.component';
import { RoomComponentComponent } from './Components/room-component/room-component.component';
import { AboutUsComponent } from './Components/about-us/about-us.component';
import { AllNotificationsComponent } from './Components/all-notifications/all-notifications.component';
import { PageNotFoundComponent } from './Components/page-not-found/page-not-found.component';
import { ModalDetailpostComponent } from './Components/home-page-post/modal-detailpost/modal-detailpost.component';
import { UpdateVipComponent } from './Components/upgrade-vip/update-vip/update-vip.component';
import { VipHistoryComponent } from './Components/upgrade-vip/vip-history/vip-history/vip-history.component';
import { ChatOutsideRoomComponent } from './Components/chat-outside-room/chat-outside-room.component';
import { QuizQuestionsComponent } from './Components/quiz/quiz-questions/quiz-questions.component';
import { WhiteboardComponent } from './Components/whiteboard/whiteboard.component';
import { LandingPageComponent } from './Components/landing-page/landing-page.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'my-profile/:id', component: MyProfileComponent },
  { path: 'rooms', component: HomePageRoomComponent },
  {
    path: 'my-profile/:id/news-feed-my-profile',
    component: NewsFeedMyProfileComponent,
  },
  { path: 'posts', component: HomePagePostComponent },
  { path: 'posts/:id', component: ModalDetailpostComponent },
  { path: 'room/:roomId', component: RoomComponentComponent },
  { path: 'all-notification', component: AllNotificationsComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'up-vip', component: UpdateVipComponent },
  { path: 'vip-history', component: VipHistoryComponent },
  { path: 'chat', component: ChatOutsideRoomComponent },

  { path: 'quiz', component: WhiteboardComponent },
  { path: 'manageQuiz', component: QuizQuestionsComponent },

  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
