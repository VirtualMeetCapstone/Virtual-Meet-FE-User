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
import { NavbarComponent } from './Components/nav-bar/nav-bar.component';

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
  ],
  imports: [BrowserModule, AppRoutingModule, CommonModule],
  providers: [provideClientHydration()],
  bootstrap: [AppComponent],
})
export class AppModule {}
