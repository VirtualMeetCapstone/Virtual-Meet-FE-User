import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { AuthService } from '../../services/auth-service/auth.service';
import { ChatOutsideRoomService } from '../../services/chat-outside-room/chat-outside-room.service';
import { json } from 'stream/consumers';
import { SearchService } from '../../services/search-service/search.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-chat-outside-room',
  templateUrl: './chat-outside-room.component.html',
  styleUrl: './chat-outside-room.component.scss',
})
export class ChatOutsideRoomComponent implements OnInit {
  activeView: 'contacts' | 'chat' = 'contacts';
  content: string = '';
  currentChat: string | null = null;
  isMobile = false;
  user: any = null;
  userId: string = '';
  contacts: any = [];
  ChatDetails: any = [];
  reiceiverUser: any = null;
  listSearch: any = [];
  contentToSearch: string = '';
  private searchSubject = new Subject<string>();
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  searchTimeout: any;
  isTyping: any = false;

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error(err);
    }
  }
  constructor(
    private authService: AuthService,
    private chatService: ChatOutsideRoomService,
    private searchService: SearchService
  ) {}
  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());

    if (this.authService.isLoggedIn()) {
      this.user = this.authService.getUser();
      this.userId = this.user.id;
      this.authService
        .getFullInformationOfUseById(this.userId)
        .subscribe((user: any) => {
          this.user = user;
        });
    }
    this.chatService.getChatHistory(this.userId).subscribe((data) => {
      this.contacts = data.map((contact: any) => ({
        ...contact,
        isTyping: false,
      }));
      console.log(this.contacts);
    });
    this.chatService.messageReceived$.subscribe((message) => {
      this.showChat(this.reiceiverUser);
      this.chatService.getChatHistory(this.userId).subscribe((data) => {
        this.contacts = data.map((contact: any) => ({
          ...contact,
          isTyping: false,
        }));
      });
    });
    this.chatService.userIsTyping$.subscribe((message) => {
      if (message) {
        const typingContact = this.contacts.find(
          (c: any) => c.contactId === message.user
        );
        if (typingContact) {
          typingContact.isTyping = true;

          setTimeout(() => {
            typingContact.isTyping = false;
            this.contacts = [...this.contacts];
          }, 5000);
        }
        if (
          this.reiceiverUser &&
          message.user == this.reiceiverUser.contactId
        ) {
          this.isTyping = true;
          setTimeout(() => {
            this.isTyping = false;
          }, 5000);
        }
      }
    });
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchUser(searchTerm);
      });
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 800;
    if (!this.isMobile) {
      this.activeView = 'contacts';
    }
  }
  UserTyping() {
    if (this.reiceiverUser && this.userId) {
      this.chatService.userIsTyping(this.userId, this.reiceiverUser.contactId);
    }
  }

  searchUser(searchTerm: string) {
    this.searchService.searchUserByName(searchTerm).subscribe((data: any) => {
      this.listSearch = data;
    });
  }
  showChat(contact: any) {
    this.isTyping = false;

    this.currentChat = contact.contactName;
    if (this.isMobile) {
      this.activeView = 'chat';
    }
    this.chatService
      .markRead(this.userId, contact.contactId)
      .subscribe((data) => {
        this.chatService.getChatHistory(this.userId).subscribe((data) => {
          this.contacts = data.map((contact: any) => ({
            ...contact,
            isTyping: false,
          }));
          console.log(this.contacts);
        });
      });
    this.chatService
      .getChatWithUser(this.userId, contact.contactId)
      .subscribe((data) => {
        this.ChatDetails = data;
        setTimeout(() => this.scrollToBottom(), 0);
      });
    this.reiceiverUser = contact;
  }
  showChatFromSearch(contact: any) {
    this.contentToSearch = '';
    this.listSearch = [];
    this.currentChat = contact.name;
    if (this.isMobile) {
      this.activeView = 'chat';
    }
    this.chatService
      .getChatWithUser(this.userId, contact.id)
      .subscribe((data) => {
        this.ChatDetails = data;
        setTimeout(() => this.scrollToBottom(), 0);
      });
    this.reiceiverUser = {
      contactId: contact.id,
      contactName: contact.name,
      contactImage: contact.picture.url,
    };
  }
  sendPrivateChat() {
    var data = {
      content: this.content,
      senderId: this.userId,
      senderName: this.user.name,
      senderImageUrl: this.user.picture.url,
      receiverId: this.reiceiverUser.contactId,
      receiverName: this.reiceiverUser.contactName,
      receiverImageUrl: this.reiceiverUser.contactImage,
      conversationType: 'Private',
      messageType: 'text',
    };
    this.chatService.sendPrivateMessage(data).subscribe((data: any) => {
      this.showChat(this.reiceiverUser);
      setTimeout(() => this.scrollToBottom(), 0);
    });
    this.content = '';
  }
  showContacts() {
    if (this.isMobile) {
      this.activeView = 'contacts';
    }
  }
}
