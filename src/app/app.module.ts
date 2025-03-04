import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './Components/Common/header/header.component';
import { HomeComponent } from './Components/home/home.component';
import { LoginModalComponent } from './Components/Common/login-modal/login-modal.component';
import { HomePageRoomComponent } from './Components/home-page-room/home-page-room.component';
import { EditProfileDialogComponent } from './Components/edit-my-profile-dialog/edit-profile-dialog.component';
import { MyProfileComponent } from './Components/my-profile/my-profile.component';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './Components/loading/loading.component';
import { MatDialogModule } from '@angular/material/dialog';
import { NavbarComponent } from './Components/Common/nav-bar/nav-bar.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import {
  HttpClientModule,
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ModalDeleteRoomComponent } from './Components/home-page-room/modal-delete-room/modal-delete-room.component';
import { StoryListComponent } from './Components/story-list/story-list.component';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { StoryModalMyProfileComponent } from './Components/story-modal-my-profile/story-modal-my-profile.component';

import {
  SocialLoginModule,
  SocialAuthServiceConfig,
  GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';

import { RoomListComponent } from './Components/my-profile/room-list/room-list.component';
import { PostsFeedComponent } from './Components/my-profile/posts-feed/posts-feed.component';
import { MyPostComponent } from './Components/my-profile/my-post/my-post.component';
import { ModalAddEditRoomComponent } from './Components/home-page-room/modal-add-edit-room/modal-add-edit-room.component';
import { HomePagePostComponent } from './Components/home-page-post/home-page-post.component';
import { MyProfileStoriesComponent } from './Components/my-profile/my-profile-stories/my-profile-stories.component';
import { StoryModalComponent } from './Components/story-modal/story-modal.component';
import { SafeUrlPipe } from './Components/story-modal-my-profile/pipe/safe-url.pipe';
import { TimeAgoPipe } from './Components/story-modal-my-profile/pipe/time-ago.pipe';
import { YoutubePlayerComponent } from './Components/youtube-player/youtube-player.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    HomePageRoomComponent,
    EditProfileDialogComponent,
    MyProfileComponent,
    NavbarComponent,
    LoadingComponent,
    RoomListComponent,
    PostsFeedComponent,
    MyPostComponent,
    ModalDeleteRoomComponent,
    StoryListComponent,
    StoryModalMyProfileComponent,
    StoryModalComponent,
    LoginModalComponent,
    ModalAddEditRoomComponent,
    HomePagePostComponent,
    MyProfileStoriesComponent,
    SafeUrlPipe,
    TimeAgoPipe,
    YoutubePlayerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    MatDialogModule,
    InfiniteScrollModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CarouselModule,
    ButtonModule,
    TagModule,
    DialogModule,
    SocialLoginModule,
    GoogleSigninButtonModule,
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        lang: 'en',
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '656676369191-dqpe6vbl3tdv29hedg1klbe2v1d75qqo.apps.googleusercontent.com',
              {
                oneTapEnabled: true,
                prompt: 'consent',
              }
            ),
          },
        ],
        onError: (err) => {
          console.error(err);
        },
      } as SocialAuthServiceConfig,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
