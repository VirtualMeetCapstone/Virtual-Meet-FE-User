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
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { LoadingComponent } from './Components/loading/loading.component';
import { MatDialogModule } from '@angular/material/dialog';
import { NavbarComponent } from './Components/Common/nav-bar/nav-bar.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SpeedDialModule } from 'primeng/speeddial';
import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TokenInterceptor } from './services/auth-service/TokenInterceptor';
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
import { TimeAgoFeedPipe } from './Components/news-feed-my-profile/pipe/time-ago-feed.pipe';
import { CreateStoryDialogComponent } from './Components/create-story-dialog/create-story-dialog.component';
import { YoutubePlayerComponent } from './Components/youtube-player/youtube-player.component';
import { RoomChatComponent } from './Components/room-chat/room-chat.component';
import { RoomComponentComponent } from './Components/room-component/room-component.component';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ParticipantListComponent } from './Components/participant-list/participant-list.component';
import { HightlightStoryMyProfileComponent } from './Components/hightlight-story-my-profile/hightlight-story-my-profile.component';
import { ModalGearButtonComponent } from './Components/my-profile/modal-gear-button/modal-gear-button.component';
import { NewsFeedMyProfileComponent } from './Components/news-feed-my-profile/news-feed-my-profile.component';
import { ModalDetailpostComponent } from './Components/home-page-post/modal-detailpost/modal-detailpost.component';
import { CreatePostModalComponent } from './Components/create-post-modal/create-post-modal.component';
import { AllNotificationsComponent } from './Components/all-notifications/all-notifications.component';

import { PageNotFoundComponent } from './Components/page-not-found/page-not-found.component';
import { StoryModalNewsFeedComponent } from './Components/story-modal-news-feed/story-modal-news-feed.component';
import { SearchComponent } from './Components/Common/search/search.component';
import { RoomDetailModalComponent } from './Components/room-detail-modal/room-detail-modal.component';

import { EmotionControlsComponent } from './Components/room-component/emotion-controls/emotion-controls.component';

import { HttpBackend, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { AboutUsComponent } from './Components/about-us/about-us.component';
import { ModalDeleteAccountComponent } from './Components/my-profile/modal-delete-account/modal-delete-account.component';
import { RoomVideoControlComponent } from './Components/room-component/room-video-control/room-video-control.component';
import { UpdateVipComponent } from './Components/upgrade-vip/update-vip/update-vip.component';
import { ModalEnterpassforroomprivateComponent } from './Components/home-page-room/modal-enterpassforroomprivate/modal-enterpassforroomprivate.component';
import { ModalDeletePostComponent } from './Components/home-page-post/modal-delete-post/modal-delete-post.component';
import { VipHistoryComponent } from './Components/upgrade-vip/vip-history/vip-history/vip-history.component';
import { ReactionSummaryComponent } from './Components/reaction-summary/reaction-summary.component';
import { LoadingPostComponent } from './Components/loading-post/loading-post.component';
import { AiChatBoxComponent } from './Components/ai-chat-box/ai-chat-box.component';

export function HttpLoaderFactory(_httpBackend: HttpBackend) {
  return new MultiTranslateHttpLoader(_httpBackend, ['assets/lang/']); // /i18n/core/ on angular >= v18 with the new public logic
}

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
    StoryModalNewsFeedComponent,
    LoginModalComponent,
    ModalAddEditRoomComponent,
    HomePagePostComponent,
    MyProfileStoriesComponent,
    SafeUrlPipe,
    TimeAgoPipe,
    TimeAgoFeedPipe,
    CreateStoryDialogComponent,
    YoutubePlayerComponent,
    RoomComponentComponent,
    RoomChatComponent,
    ParticipantListComponent,
    HightlightStoryMyProfileComponent,
    ModalGearButtonComponent,
    NewsFeedMyProfileComponent,
    ModalDetailpostComponent,
    CreatePostModalComponent,
    AllNotificationsComponent,
    SearchComponent,
    PageNotFoundComponent,
    RoomDetailModalComponent,
    EmotionControlsComponent,
    AboutUsComponent,
    ModalDeleteAccountComponent,
    RoomVideoControlComponent,
    UpdateVipComponent,
    ModalEnterpassforroomprivateComponent,
    ModalDeletePostComponent,
    VipHistoryComponent,
    ReactionSummaryComponent,
    LoadingPostComponent,
    AiChatBoxComponent,
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
    NgOptimizedImage,
    SpeedDialModule,
    Toast,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpBackend],
      },
    }),
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
          console.error('Google Login Error:', err);
        },
      } as SocialAuthServiceConfig,
    },

    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
  ],

  bootstrap: [AppComponent],
})
export class AppModule {}
