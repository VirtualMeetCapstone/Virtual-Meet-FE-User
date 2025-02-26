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
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ModalDeleteRoomComponent } from './Components/home-page-room/modal-delete-room/modal-delete-room.component';
import { StoryListComponent } from './Components/story-list/story-list.component';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { StoryModalComponent } from './Components/story-modal/story-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    LoginModalComponent,
    HomePageRoomComponent,
    EditProfileDialogComponent,
    MyProfileComponent,
    NavbarComponent,
    LoadingComponent,
    ModalDeleteRoomComponent,
    StoryListComponent,
    StoryModalComponent,

    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    MatDialogModule,
    InfiniteScrollModule,
    HttpClientModule,
    FormsModule,
    CarouselModule,
    ButtonModule,
    TagModule,
    DialogModule
  ],
  providers: [provideClientHydration()],
  bootstrap: [AppComponent],
})
export class AppModule {}
