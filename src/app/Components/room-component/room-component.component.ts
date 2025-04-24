import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  Injector,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomHubService } from '../../Hub/room-hub/room-hub.service';
import { RtcHubService } from '../../Hub/rtc-hub/rtc-hub.service';
import { PlayerService } from '../../services/youtubeplayer-service/player.service';
import { YoutubePlayerComponent } from '../../Components/youtube-player/youtube-player.component';
import { AuthService } from '../../services/auth-service/auth.service';
import { Peer } from '../../models/rtc/pere';
import { ChangeDetectorRef } from '@angular/core';
import { SpeechService } from '../../services/external-service/speech.service';
import { TranslateService } from '../../services/external-service/translate.service';
import {
  Poll,
  PollComponentComponent,
} from './poll-component/poll-component.component';
import { UserVipService } from './../../services/user-vip-service/user-vip.service';

@Component({
  selector: 'app-room-component',
  templateUrl: './room-component.component.html',
  styleUrls: ['./room-component.component.scss'],
})
export class RoomComponentComponent implements OnInit {
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: any) {
    this.leaveRoom();
  }

  @ViewChild(YoutubePlayerComponent) youtubeComponent!: YoutubePlayerComponent;
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;
  @ViewChild(PollComponentComponent) pollComponent!: PollComponentComponent;

  constructor(
    private speechService: SpeechService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private _playerService: PlayerService,
    private roomHubService: RoomHubService,
    private rtcHub: RtcHubService,
    private injector: Injector,
    private authService: AuthService,
    private userVipService: UserVipService, // Consistent naming
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.userId = authService.getUser()?.id || '';
  }

  // State variables
  roomId: string = '';
  userId: string = '';
  joinNotification: string = '';
  userList: string[] = [];
  user: any = null;
  raisedHands: string[] = [];
  private videoElement: HTMLVideoElement | null = null;
  roomPassword: string = '1234';
  polls: Poll[] = [];
  isYouTubeActive = false;
  isParticipantsOpen = false;
  isActivityModalOpen: boolean = false;
  isChatOpen = false;
  roomState: any;
  activePoll: Poll | null = null;
  isPollOpen = false;

  // WebRTC-related
  connectionStatus: string = 'Connecting...';
  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  participantCount = 0;
  peers: Peer[] = [];
  isScreenSharing = false;
  isMicOn: boolean = true;
  isCameraOn: boolean = true;

  // Recording
  isRecordingModalOpen: boolean = false;
  isRecording: boolean = false;
  recordWithAudio: boolean = true;

  // Subtitles
  subtitle = '';
  selectedLanguage = 'vi-VN';
  selectedLangTarget = 'vi-VN';
  isSubtitlesEnabled = false;
  isGlobalSubtitlesEnabled = false;
  private isReceiveSubtitleRegistered = false;
  subtitles: { username: string; text: string; timestamp: number }[] = [];
  private userNameCache = new Map<string, string>();

  // Pinning
  pinnedUser: Peer | null = null;
  isPinned: boolean = false;
  bubbles: { type: string; userName: string; x: number; y: number }[] = [];

  // Popups
  isKickPopupVisible: boolean = false;
  kickReason: string = '';
  countdown: number = 5;
  isSummarizeBtnVisible = true;
  showCallSummaryModal: boolean = false;
  callSummaryText: string = '';
  isLoading: boolean = false;
  showConfirmModal = false;
  confirmMessage = '';
  private confirmResolve: ((result: boolean) => void) | null = null;

  ngOnDestroy() {
    this.leaveRoom();
  }

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.roomPassword = params['password'] || this.roomPassword;
      console.log('🔑 Room password:', this.roomPassword);
    });

    this.route.paramMap.subscribe((params) => {
      const roomId = params.get('roomId');
      if (roomId) {
        this.roomId = roomId;
        localStorage.setItem('roomId', this.roomId);
        console.log('📌 Room ID from router:', this.roomId);
      }
    });

    try {
      await this.roomHubService.startConnection();
      this.connectionStatus = 'Connected';

      this.roomHubService.receiveJoinFailed((message: string) => {
        console.log('❌ Join failed:', message);
        window.confirm(message);
        window.location.href = '/';
      });

      this.roomHubService.onRoomStateReceived((state) => {
        this.roomState = state;
        if (state.sharing) {
          this.isYouTubeActive = true;
          this._playerService.initializePlayer(state.videoId, state.time, state.isPaused);
        }
      });

      this.roomHubService.setConfirmHandler((msg) => this.showConfirm(msg));

      // Log VIP status for debugging
      console.log('👑 VIP status:', this.userVipService.isVip());

      await this.roomHubService.joinRoom(
        this.userId,
        this.roomId,
        this.roomPassword,
        this.userVipService.isVip()
      );

      this.initializeEventListeners();

      this.roomHubService.participants$.subscribe((count) => {
        this.participantCount = count;
      });

      this.rtcHub.peers$.subscribe(async (peers) => {
        this.peers = await Promise.all(
          peers.map(async (peer) => {
            const isCurrentUser = peer.peerId === this.userId;
            const userInfo = await this.loadUserInfo(peer.userName);
            return {
              ...peer,
              userName: isCurrentUser ? 'You' : userInfo?.name || peer.userName,
              avatarUrl: userInfo?.picture?.url,
            };
          })
        );
      });

      await this.displayLocalStream();

      // Register subtitle and summary handlers
      this.setupEventHandlers();
    } catch (err) {
      console.error('❌ Error initializing room:', err);
      this.connectionStatus = 'Connection failed';
    }
  }

  private setupEventHandlers(): void {
    this.roomHubService.receiveSummary((summary: string) => {
      console.log('📝 Call summary received:', summary);
      this.showCallSummaryModal = true;
      this.isLoading = false;
      this.callSummaryText = summary.replace(/\n/g, '<br>');
    });

    this.roomHubService.receiveHostKickUser((userId: string, reason: string) => {
      if (this.userId === userId) {
        this.kickReason = reason;
        this.isKickPopupVisible = true;
        this.countdown = 5;

        const countdownInterval = setInterval(() => {
          this.countdown--;
          if (this.countdown <= 0) {
            clearInterval(countdownInterval);
            this.roomHubService.leaveRoom();
            this.isKickPopupVisible = false;
          }
        }, 1000);
      }
    });

    if (!this.isReceiveSubtitleRegistered) {
      this.roomHubService.receiveSubtitle(async (username, subtitle, sourceLang) => {
        if (!this.isSubtitlesEnabled) return;

        try {
          this.displaySubtitle(username, subtitle, 5000, false);
          const targetLang = this.selectedLangTarget.split('-')[0];
          if (sourceLang !== targetLang) {
            const translatedText = await this.translateService.translate(subtitle, sourceLang, targetLang);
            this.displaySubtitle(username, translatedText, 10000, true);
          }
        } catch (error) {
          console.error('❌ Subtitle translation error:', error);
          this.displaySubtitle(username, subtitle, 5000);
        }
      });
      this.isReceiveSubtitleRegistered = true;
    }

    this.roomHubService.receivePollUpdate((updatedPolls) => {
      this.polls = updatedPolls;
      if (this.pollComponent && this.pollComponent.selectedPoll) {
        const updatedSelectedPoll = updatedPolls.find(
          (poll) => poll.id === this.pollComponent.selectedPoll?.id
        );
        if (updatedSelectedPoll) {
          this.pollComponent.selectedPoll = updatedSelectedPoll;
        }
      }
      this.cdr.detectChanges();
    });
  }

  private initializeEventListeners(): void {
    this.roomHubService.ReceiveJoinNotification(async (userId: string) => {
      const name = await this.authService.fetchUserName(userId);
      this.showJoinNotification(name || userId);
    });

    this.roomHubService.receiveVipJoinNotification(async (userId: string) => {
      const username = await this.authService.fetchUserName(userId);
      console.log('👑 VIP Join Notification:', username || userId);
      this.showVipJoinNotification(username || userId);
    });

    this.roomHubService.receiveShare(() => {
      this.isYouTubeActive = true;
    });

    this.roomHubService.onVideoSelected((roomId, videoId, time, isPaused) => {
      this._playerService.initializePlayer(videoId, time, isPaused);
    });

    this.roomHubService.receiveHostMuted(async (userId: string, muted: boolean) => {
      if (userId === this.userId) {
        this.isMicOn = !muted;
        muted ? await this.rtcHub.forceMute() : await this.rtcHub.forceUnmute();
      }
    });

    this.roomHubService.receiveHostMutedVIdeo(async (userId: string, muted: boolean) => {
      if (userId === this.userId) {
        this.isCameraOn = !muted;
        muted ? await this.rtcHub.forceCamera() : await this.rtcHub.forceCameraOn();
      }
    });
  }

  async loadUserInfo(userId: string): Promise<any> {
    if (this.userNameCache.has(userId)) {
      return this.userNameCache.get(userId);
    }
    const user = await this.authService.getBackendUser(userId);
    this.userNameCache.set(userId, user);
    return user;
  }

  private showJoinNotification(userName: string): void {
    this.joinNotification = `${userName} đã tham gia phòng`;
    setTimeout(() => (this.joinNotification = ''), 3000);
  }

  private showVipJoinNotification(username: string): void {
    this.joinNotification = `👑 VIP ${username} đã tham gia phòng`;
    setTimeout(() => (this.joinNotification = ''), 5000);
  }

  getVideoGridClass(): string {
    const totalUsers = this.peers.length + 1;
    return `users-${Math.min(totalUsers, 12)}`;
  }

  getDisplayedParticipants(): Peer[] {
    return this.peers.slice(0, 11);
  }

  getRemainingCount(): number {
    return this.peers.length > 11 ? this.peers.length - 11 : 0;
  }

  // UI Controls
  closeSummaryModal(): void {
    this.showCallSummaryModal = false;
  }

  toggleActivityModal(): void {
    this.isActivityModalOpen = !this.isActivityModalOpen;
  }

  closeActivityModal(): void {
    this.isActivityModalOpen = false;
  }

  closeAllModals(): void {
    this.isActivityModalOpen = false;
    if (this.isYouTubeActive) {
      this._playerService.pauseVideo();
    }
    this.isYouTubeActive = false;
  }

  startYouTubeTogether(): void {
    if (this.isYouTubeActive) {
      this.closeActivityModal();
      return;
    }
    this.isYouTubeActive = true;
    this.closeActivityModal();
    this.roomHubService.sendShare()
      .then(() => console.log('✅ Share event sent'))
      .catch((err) => console.error('❌ Share event error:', err));
  }

  startWhiteboard(): void {
    this.isYouTubeActive = false;
    this.closeActivityModal();
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
  }

  toggleParticipants(): void {
    this.isParticipantsOpen = !this.isParticipantsOpen;
  }

  toggleClose(): void {
    this.isChatOpen = false;
    this.isParticipantsOpen = false;
  }

  togglePoll(): void {
    this.isPollOpen = !this.isPollOpen;
  }

  async leaveRoom(): Promise<void> {
    try {
      await this.rtcHub.leaveRoom();
    } catch (err) {
      console.error('❌ Error leaving room:', err);
    }
  }

  copySummary(): void {
    const summaryText = document.getElementById('callSummaryText')?.innerText;
    if (summaryText) {
      navigator.clipboard.writeText(summaryText)
        .then(() => alert('Đã sao chép nội dung!'))
        .catch((err) => console.error('❌ Copy error:', err));
    }
  }

  summarizeCall(): void {
    this.roomHubService.summarizeSubtitles(this.roomId);
    this.isSummarizeBtnVisible = false;
    this.isLoading = true;
    setTimeout(() => (this.isSummarizeBtnVisible = true), 10000);
  }

  toggleVideo(): void {
    this.rtcHub.toggleVideo();
    this.isCameraOn = this.roomHubService.videoEnabled;
  }

  toggleAudio(): void {
    this.rtcHub.toggleAudio();
    this.isMicOn = this.roomHubService.audioEnabled;
    this.isMicOn ? this.startSendingSubtitles() : this.stopSendingSubtitles();
  }

  private async displayLocalStream(): Promise<void> {
    const stream = this.roomHubService.getLocalStream();
    if (stream && this.localVideo) {
      this.localVideo.nativeElement.srcObject = stream;
      this.localVideo.nativeElement.muted = true;
      this.isMicOn = this.roomHubService.audioEnabled;
      this.isCameraOn = this.roomHubService.videoEnabled;
      this.cdr.detectChanges();
    }
  }

  get audioEnabled(): boolean {
    return this.roomHubService.audioEnabled;
  }

  get videoEnabled(): boolean {
    return this.roomHubService.videoEnabled;
  }

  toggleScreenShare(): void {
    this.isScreenSharing ? this.rtcHub.stopScreenShare() : this.rtcHub.startScreenShare();
    this.isScreenSharing = !this.isScreenSharing;
  }

  pinUser(peer: Peer | null): void {
    if (!peer) return;
    this.pinnedUser = this.pinnedUser?.userName === peer.userName ? null : peer;
    this.isPinned = !!this.pinnedUser;
  }

  toggleRecordingModal(): void {
    this.isRecordingModalOpen = !this.isRecordingModalOpen;
  }

  toggleRecordWithAudio(): void {
    this.recordWithAudio = !this.recordWithAudio;
  }

  async startRecording(): Promise<void> {
    try {
      await this.rtcHub.startRecording(this.recordWithAudio);
      this.isRecording = this.rtcHub.isRecording;
      this.isRecordingModalOpen = false;
    } catch (error) {
      console.error('❌ Start recording error:', error);
    }
  }

  async stopRecording(): Promise<void> {
    try {
      await this.rtcHub.stopRecording();
      this.isRecording = this.rtcHub.isRecording;
    } catch (error) {
      console.error('❌ Stop recording error:', error);
    }
  }

  async onCreatePoll(pollData: { question: string; options: string[] }): Promise<void> {
    await this.roomHubService.createPoll(this.roomId, pollData.question, pollData.options);
  }

  async onVote(voteData: { pollId: string; optionId: string }): Promise<void> {
    await this.roomHubService.voteOnPoll(this.roomId, voteData.pollId, voteData.optionId);
  }

  async onDeletePoll(pollId: string): Promise<void> {
    await this.roomHubService.deletePoll(this.roomId, pollId);
    this.cdr.detectChanges();
  }

  async onEndPoll(pollId: string): Promise<void> {
    await this.roomHubService.endPoll(this.roomId, pollId);
    this.cdr.detectChanges();
  }

  onEmotionSent(event: { type: string; userName: string; x: number; y: number }): void {
    if (!event || !event.userName) return;
    const displayName = event.userName === this.userId ? 'you' : event.userName;
    const modifiedEvent = { ...event, userName: displayName };
    this.bubbles.push(modifiedEvent);
    this.cdr.detectChanges();
    setTimeout(() => {
      this.bubbles = this.bubbles.filter((b) => b !== modifiedEvent);
      this.cdr.detectChanges();
    }, 5000);
  }

  onRaiseHand(event: { userName: string }): void {
    if (!event || !event.userName || this.raisedHands.includes(event.userName)) return;
    this.raisedHands.push(event.userName);
    this.cdr.detectChanges();
  }

  onLowerHand(event: { userName: string }): void {
    if (!event || !event.userName) return;
    const index = this.raisedHands.indexOf(event.userName);
    if (index !== -1) {
      this.raisedHands.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      love: 'fa-solid fa-heart',
      haha: 'fa-solid fa-face-laugh',
      like: 'fa-solid fa-thumbs-up',
      wow: 'fa-solid fa-face-surprise',
      sad: 'fa-solid fa-face-sad-tear',
      angry: 'fa-solid fa-face-angry',
    };
    return icons[type] || '';
  }

  toggleSubtitles(): void {
    this.isSubtitlesEnabled = !this.isSubtitlesEnabled;
    if (!this.isSubtitlesEnabled) this.subtitle = '';
    this.cdr.detectChanges();
  }

  private async startSendingSubtitles(): Promise<void> {
    this.speechService.startListening(async (text) => {
      if (!text || text.trim().length === 0) return;
      const detectedLang = this.speechService.detectLanguageWithConfidence(text);
      this.roomHubService.sendSubtitle(text, detectedLang);
      if (this.isSubtitlesEnabled) this.subtitle = text;
      this.cdr.detectChanges();
    }, this.selectedLanguage);
  }

  private stopSendingSubtitles(): void {
    this.speechService.stopListening();
  }

  displaySubtitle(username: string, text: string, duration: number = 5000, isTranslated: boolean = false): void {
    const subtitleObj = { username, text: isTranslated ? `🔄 ${text}` : text, timestamp: Date.now() };
    this.subtitles.push(subtitleObj);
    if (this.subtitles.length > 5) this.subtitles.shift();
    this.cdr.detectChanges();
    setTimeout(() => {
      this.subtitles = this.subtitles.filter((s) => s !== subtitleObj);
      this.cdr.detectChanges();
    }, duration);
  }

  changeLanguage(event: any): void {
    this.selectedLangTarget = event.target.value;
    if (this.isMicOn) {
      this.stopSendingSubtitles();
      this.startSendingSubtitles();
    }
  }

  onResolutionChanged(resolution: { width: number; height: number }): void {
    console.log(`🔧 Resolution changed: ${resolution.width}x${resolution.height}`);
    this.displayLocalStream();
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.displayLocalStream();
  }

  async showConfirm(message: string): Promise<boolean> {
    this.showConfirmModal = false;
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.confirmMessage = message;
    this.showConfirmModal = true;
    this.cdr.detectChanges();
    return new Promise<boolean>((resolve) => (this.confirmResolve = resolve));
  }

  onConfirmResult(result: boolean): void {
    this.showConfirmModal = false;
    if (this.confirmResolve) {
      setTimeout(() => {
        this.confirmResolve!(result);
        this.confirmResolve = null;
      }, 50);
    }
    this.cdr.detectChanges();
  }
}
