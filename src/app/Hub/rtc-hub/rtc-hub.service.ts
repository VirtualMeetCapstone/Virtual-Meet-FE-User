import { Injectable,NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoomHubService } from '../room-hub/room-hub.service';
import { Peer } from '../../models/rtc/pere';

@Injectable({
  providedIn: 'root',
})
export class RtcHubService {
  private peers: { [key: string]: Peer } = {};
  private peersSubject = new BehaviorSubject<Peer[]>([]);
  private screenStream!: MediaStream | null;
  private mediaRecorder!: MediaRecorder | null;
  private recordedChunks: Blob[] = [];
  public isRecording = false;
  private recordingSubject = new BehaviorSubject<boolean>(false);
  // ICE server configuration
  private config = {
    iceServers: [
      { urls: 'stun:stun.cloudflare.com:3478' }, // Cloudflare STUN
      { urls: 'stun:stun.cloudflare.com:53' }, // Cloudflare STUN alternative
      { urls: 'turn:turn.cloudflare.com:3478?transport=udp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (UDP)
      { urls: 'turn:turn.cloudflare.com:53?transport=udp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (UDP alternative)
      { urls: 'turn:turn.cloudflare.com:3478?transport=tcp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (TCP)
      { urls: 'turn:turn.cloudflare.com:80?transport=tcp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (TCP alternative)
      { urls: 'turn:turn.cloudflare.com:5349?transport=tcp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' }, // Cloudflare TURN (secure TCP)
      { urls: 'turns:turn.cloudflare.com:443?transport=tcp', username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359', credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a' } // Cloudflare TURN (secure TCP)

    ]
  };

  constructor(private roomHubService: RoomHubService,
    private cdr: NgZone
  ) {
    this.setupRtcEvents();
  }

  // Public observable for peers
  get peers$(): Observable<Peer[]> {
    return this.peersSubject.asObservable();
  }

  // Setup WebRTC-related SignalR events
  private setupRtcEvents(): void {
    const hubConnection = this.roomHubService.getConnection();

    hubConnection.on('ExistingPeers', (peerList: any[]) => {
      peerList.forEach((peer) => {
        console.log('Connecting to existing peer:', peer.peerId);
        this.createPeerConnection(peer.peerId, peer.userName, true);

          // Gửi yêu cầu subscribe stream
  hubConnection.invoke('RequestStream', peer.peerId).catch(err =>
    console.error('❌ Error requesting stream:', err)
  );

      });

    });
  // Nhận yêu cầu gửi stream từ peer khác
  hubConnection.on('ReceiveStreamRequest', (requesterPeerId: string) => {
    console.log(`📩 Nhận yêu cầu stream từ: ${requesterPeerId}`);
    this.sendStreamToPeer(requesterPeerId);
  });


    hubConnection.on('NewPeer', (peerId: string, peerName: string, participantCount: number) => {
      console.log('New peer joined:', peerId, peerName);
      this.createPeerConnection(peerId, peerName, false);
    });

    hubConnection.on('ReceiveOffer', async (peerId: string, peerName: string, offer: string) => {
      try {
        let peer = this.peers[peerId] || this.createPeerConnection(peerId, peerName, false);
        await peer.connection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        await hubConnection.invoke('SendAnswer', peerId, JSON.stringify(answer));
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    hubConnection.on('ReceiveAnswer', async (peerId: string, answer: string) => {
      try {
        if (this.peers[peerId]) {
          await this.peers[peerId].connection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    hubConnection.on('ReceiveCandidate', async (peerId: string, candidate: string) => {
      try {
        if (this.peers[peerId]) {
          await this.peers[peerId].connection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
        }
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    });

    hubConnection.on('PeerDisconnected', (peerId: string, participantCount: number) => {
      console.log('Peer disconnected:', peerId);
      if (this.peers[peerId]) {
        this.peers[peerId].connection.close();
        delete this.peers[peerId];
        this.updatePeersSubject();
      }
    });
  }

// Gửi lại stream đến peer đã yêu cầu
private sendStreamToPeer(peerId: string): void {
  const peer = this.peers[peerId];
  if (!peer) return;

  const localStream = this.roomHubService.getLocalStream();
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peer.connection.addTrack(track, localStream);
    });
  }
}

  // Create a new peer connection
  private createPeerConnection(peerId: string, peerName: string, initiator: boolean): Peer {
    const peerConnection = new RTCPeerConnection(this.config);
    const hubConnection = this.roomHubService.getConnection();

    const peer: Peer = {
      peerId,
      userName: peerName,
      connection: peerConnection,
    };

    this.peers[peerId] = peer;

    const localStream = this.roomHubService.getLocalStream();
    if (localStream) {
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
    }

    peerConnection.ontrack = (event) => {
      peer.stream = event.streams[0];
      this.updatePeersSubject();
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        hubConnection.invoke('SendCandidate', peerId, JSON.stringify(event.candidate)).catch((err) =>
          console.error('Error sending ICE candidate:', err)
        );
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with peer ${peerId} changed to: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        delete this.peers[peerId];
        this.updatePeersSubject();
      }
    };

    if (initiator) {
      peerConnection
        .createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() =>
          hubConnection.invoke('SendOffer', peerId, JSON.stringify(peerConnection.localDescription)).catch((err) =>
            console.error('Error sending offer:', err)
          )
        )
        .catch((err) => console.error('Error creating offer:', err));
    }

    this.updatePeersSubject();
    return peer;
  }

  // Update peers subject
  private updatePeersSubject(): void {
    const peerList = Object.values(this.peers);
    this.peersSubject.next(peerList);
  }

  // Cleanup WebRTC resources
  public cleanup(): void {
    Object.keys(this.peers).forEach((peerId) => {
      if (this.peers[peerId]) {
        this.peers[peerId].connection.close();
        delete this.peers[peerId];
      }
    });
    this.updatePeersSubject();
    console.log('🧹 RtcHub resources cleaned up');
  }


  async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 15, max: 20 }
        },
        audio: true
      });

      // Gửi stream screen share tới các peer
      Object.values(this.peers).forEach(peer => {
        const sender = peer.connection.getSenders().find(s => s.track?.kind === "video");
        if (sender) {
          // const parameters = sender.getParameters();
          // if (!parameters.encodings) parameters.encodings = [{}];
          // parameters.encodings[0].maxBitrate = 500 * 1000; // Giới hạn 500kbps
          // sender.setParameters(parameters); them gioi han de tang toc do
          sender.replaceTrack(this.screenStream!.getVideoTracks()[0]);
        }
      });

      console.log("📡 Đã bắt đầu chia sẻ màn hình!");
    } catch (error) {
      console.error("❌ Lỗi khi chia sẻ màn hình:", error);
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      const localStream = this.roomHubService.getLocalStream();
      // Chuyển lại camera thay vì màn hình
      Object.values(this.peers).forEach(peer => {
        const sender = peer.connection.getSenders().find(s => s.track?.kind === "video");
        if (sender && localStream ) {
          sender.replaceTrack(localStream.getVideoTracks()[0]);
        }
      });

      console.log("🛑 Đã dừng chia sẻ màn hình!");
    }
  }

  // Start recording screen or video
  async startRecording(recordAudio: boolean = true): Promise<void> {
    try {
        if (this.isRecording) {
            console.log('⚠️ Recording already in progress');
            return;
        }

        // Lấy stream màn hình thay vì camera
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "monitor" }, // Quay toàn bộ màn hình
            audio: recordAudio ? true : false, // Thêm audio nếu cần
        });

        if (!this.screenStream) throw new Error('Không thể lấy luồng màn hình');

        const tracksToRecord: MediaStreamTrack[] = [...this.screenStream.getVideoTracks()];

        if (recordAudio) {
            const audioTracks = this.screenStream.getAudioTracks();
            if (audioTracks.length > 0) {
                tracksToRecord.push(audioTracks[0]); // Ghi cả âm thanh của màn hình
            }
        }

        const recordStream = new MediaStream(tracksToRecord);

        const options = {
            mimeType: this.getSupportedMimeType(),
            videoBitsPerSecond: 2500000, // 2.5 Mbps
        };

        this.mediaRecorder = new MediaRecorder(recordStream, options);
        this.recordedChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.saveRecording();
        };

        // Bắt đầu quay màn hình
        this.mediaRecorder.start(1000); // Ghi thành các đoạn 1 giây
        this.isRecording = true;
        this.recordingSubject.next(true);
        console.log('🔴 Đang quay màn hình');

    } catch (error) {
        console.error('❌ Lỗi khi bắt đầu quay màn hình:', error);
        this.isRecording = false;
        this.recordingSubject.next(false);
    }
}


  // Stop the current recording
  async stopRecording(): Promise<void> {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.recordingSubject.next(false);
      console.log('⏹️ Recording stopped');
    }
  }

  // Find a supported video MIME type
  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/mp4;codecs=h264,aac',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`✅ Browser supports MIME type: ${type}`);
        return type;
      }
    }

    // Fallback to basic webm if nothing else is supported
    return 'video/webm';
  }

  // Save the recording and create a download link
  private saveRecording(): void {
    try {
      if (this.recordedChunks.length === 0) {
        console.warn('⚠️ No recorded data available');
        return;
      }

      // Determine the MIME type
      const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
      const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';

      // Create a blob from the recorded chunks
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Create file name with timestamp
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
      const fileName = `recording_${timestamp}.${fileExtension}`;

      // Create a link element to download the recording
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      this.recordedChunks = [];

      console.log(`✅ Recording saved as ${fileName}`);
      this.stopRecording();
      setTimeout(() => {
        this.cdr.run(() => {
          this.isRecording = false; // Cập nhật UI một cách an toàn
        });
      }, 100);

    } catch (error) {
      console.error('❌ Error saving recording:', error);
    }
  }

  // Check if recording is in progress
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }


}
