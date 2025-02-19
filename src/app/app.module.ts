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
import { PopupComponent } from './popup/popup.component';
import { MatDialogModule } from '@angular/material/dialog';
import { NavbarComponent } from './Components/Common/nav-bar/nav-bar.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { HttpClientModule } from '@angular/common/http';

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
    PopupComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    MatDialogModule,
    InfiniteScrollModule,
    HttpClientModule,
  ],
  providers: [provideClientHydration()],
  bootstrap: [AppComponent],
})
export class AppModule {}
