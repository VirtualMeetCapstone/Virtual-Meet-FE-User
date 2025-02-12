import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './Components/Common/header/header.component';
import { HomeComponent } from './Components/home/home.component';
import { SideBarComponent } from './Components/Common/side-bar/side-bar.component';
import { LoginModalComponent } from './Components/Common/login-modal/login-modal.component';
import { HomePageRoomComponent } from './Components/home-page-room/home-page-room.component';
import { ChatListComponent } from './Components/chat-list/chat-list.component';
import { ChatBoxComponent } from './Components/chat-box/chat-box.component';
import { ChatContainerComponent } from './Components/chat-container/chat-container.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    SideBarComponent,
    LoginModalComponent,
    HomePageRoomComponent,
    ChatListComponent,
    ChatBoxComponent,
    ChatContainerComponent,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [provideClientHydration()],
  bootstrap: [AppComponent],
})
export class AppModule {}
