import { ChangeDetectorRef, Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoomHubService } from '../room-hub/room-hub.service';
import { Peer } from '../../models/rtc/pere';
import { Room, RemoteParticipant, Track } from 'livekit-client';
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

  // LiveKit properties
  private livekitRoom!: Room;
  private liveKitUrl = 'wss://vmeet-6zijw0nw.livekit.cloud'; // Thay bằng URL LiveKit server của bạn
  private liveKitToken = '';
  private maxMeshParticipants = 4; // Ngưỡng để chuyển sang LiveKit
  private usingLiveKit = false;

  private originalVideoTrack: MediaStreamTrack | null = null;

  // ICE server configuration
  private config = {
    iceServers: [
      { urls: 'stun:stun.cloudflare.com:3478' }, // Cloudflare STUN
      { urls: 'stun:stun.cloudflare.com:53' }, // Cloudflare STUN alternative
      {
        urls: 'turn:turn.cloudflare.com:3478?transport=udp',
        username:
          'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential:
          '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a',
      }, // Cloudflare TURN (UDP)
      {
        urls: 'turn:turn.cloudflare.com:53?transport=udp',
        username:
          'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential:
          '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a',
      }, // Cloudflare TURN (UDP alternative)
      {
        urls: 'turn:turn.cloudflare.com:3478?transport=tcp',
        username:
          'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential:
          '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a',
      }, // Cloudflare TURN (TCP)
      {
        urls: 'turn:turn.cloudflare.com:80?transport=tcp',
        username:
          'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential:
          '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a',
      }, // Cloudflare TURN (TCP alternative)
      {
        urls: 'turn:turn.cloudflare.com:5349?transport=tcp',
        username:
          'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential:
          '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a',
      }, // Cloudflare TURN (secure TCP)
      {
        urls: 'turns:turn.cloudflare.com:443?transport=tcp',
        username:
          'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential:
          '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a',
      }, // Cloudflare TURN (secure TCP)
    ],
  };

  constructor(private roomHubService: RoomHubService, private cdr: NgZone,) {
    this.setupRtcEvents();
  }

  // Public observable for peers
  get peers$(): Observable<Peer[]> {
    return this.peersSubject.asObservable();
  }
  getPeerConnection(peerId: string): RTCPeerConnection | null {
    const peer = this.peers[peerId];
    return peer?.connection || null; // Sửa lỗi cú pháp ở đây
  }

  // Setup WebRTC-related SignalR events
  private setupRtcEvents(): void {
    const hubConnection = this.roomHubService.getConnection();

    hubConnection.on('ExistingPeers', (peerList: any[]) => {
      if (this.usingLiveKit) return;
      peerList.forEach((peer) => {
        this.createPeerConnection(peer.peerId, peer.userName, true);
        hubConnection
          .invoke('RequestStream', peer.peerId)
          .catch((err) => console.error('❌ Error requesting stream:', err));
      });
      this.checkParticipantsAndSwitch();
    });

    hubConnection.on('NewPeer', (peerId: string, peerName: string) => {
      if (this.usingLiveKit) return;
      this.createPeerConnection(peerId, peerName, false);
      this.checkParticipantsAndSwitch();
    });

    hubConnection.on('ReceiveStreamRequest', (requesterPeerId: string) => {
      console.log(`📩 Nhận yêu cầu stream từ: ${requesterPeerId}`);
      this.sendStreamToPeer(requesterPeerId);
    });

    hubConnection.on(
      'ReceiveOffer',
      async (peerId: string, peerName: string, offer: string) => {
        try {
          let peer =
            this.peers[peerId] ||
            this.createPeerConnection(peerId, peerName, false);
          if (!peer.connection) return; // Kiểm tra connection
          await peer.connection.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(offer))
          );
          const answer = await peer.connection.createAnswer();
          await peer.connection.setLocalDescription(answer);
          await hubConnection.invoke(
            'SendAnswer',
            peerId,
            JSON.stringify(answer)
          );
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      }
    );

    hubConnection.on(
      'ReceiveAnswer',
      async (peerId: string, answer: string) => {
        try {
          const peer = this.peers[peerId];
          if (peer?.connection) {
            await peer.connection.setRemoteDescription(
              new RTCSessionDescription(JSON.parse(answer))
            );
          }
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    );

    hubConnection.on(
      'ReceiveCandidate',
      async (peerId: string, candidate: string) => {
        try {
          const peer = this.peers[peerId];
          if (peer?.connection) {
            await peer.connection.addIceCandidate(
              new RTCIceCandidate(JSON.parse(candidate))
            );
          }
        } catch (err) {
          console.error('Error handling ICE candidate:', err);
        }
      }
    );

    hubConnection.on('PeerDisconnected', (peerId: string) => {
      if (this.usingLiveKit) return;
      const peer = this.peers[peerId];
      if (peer?.connection) {
        peer.connection.close();
        delete this.peers[peerId];
        this.updatePeersSubject();
      }
      this.checkParticipantsAndSwitch();
    });
  }

  private sendStreamToPeer(peerId: string): void {
    const peer = this.peers[peerId];
    if (!peer?.connection) return;

    const localStream = this.roomHubService.getLocalStream();
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peer.connection!.addTrack(track, localStream); // Dùng ! vì đã kiểm tra ở trên
      });
    }
  }

  private createPeerConnection(
    peerId: string,
    peerName: string,
    initiator: boolean
  ): Peer {
    if (this.usingLiveKit) {
      const peer: Peer = { peerId, userName: peerName };
      this.peers[peerId] = peer;
      this.updatePeersSubject();
      return peer;
    }

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
      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));
    }

    peerConnection.ontrack = (event) => {
      peer.stream = event.streams[0];
      console.log('Received remote stream for peer:', peer.peerId);
      this.updatePeersSubject();
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        hubConnection
          .invoke('SendCandidate', peerId, JSON.stringify(event.candidate))
          .catch((err) => console.error('Error sending ICE candidate:', err));
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (
        peerConnection.connectionState === 'failed' ||
        peerConnection.connectionState === 'closed'
      ) {
        delete this.peers[peerId];
        this.updatePeersSubject();
      }
    };

    if (initiator) {
      peerConnection
        .createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() =>
          hubConnection.invoke(
            'SendOffer',
            peerId,
            JSON.stringify(peerConnection.localDescription)
          )
        )
        .catch((err) => console.error('Error creating offer:', err));
    }

    this.updatePeersSubject();
    return peer;
  }
  // Update peers subject
  private updatePeersSubject(): void {
    this.cdr.run(() => {
    const peerList = Object.values(this.peers);
    console.log(
      'Peers list updated:',
      peerList.map((p) => ({ id: p.peerId, hasStream: !!p.stream }))
    );
    this.peersSubject.next([...peerList]);
  })}

  // Cleanup WebRTC resources
  public cleanup(): void {
    Object.keys(this.peers).forEach((peerId) => {
      if (this.peers[peerId]) {
        this.peers[peerId].connection?.close();
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
        const sender = peer.connection?.getSenders().find(s => s.track?.kind === "video");
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
        const sender = peer.connection?.getSenders().find(s => s.track?.kind === "video");
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
        video: { displaySurface: 'monitor' }, // Quay toàn bộ màn hình
        audio: recordAudio ? true : false, // Thêm audio nếu cần
      });

      if (!this.screenStream) throw new Error('Không thể lấy luồng màn hình');

      const tracksToRecord: MediaStreamTrack[] = [
        ...this.screenStream.getVideoTracks(),
      ];

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
      'video/mp4',
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
      const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
        .getHours()
        .toString()
        .padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
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
  getRTCSender(videoTrack: MediaStreamTrack): RTCRtpSender | null {
    for (const peer of Object.values(this.peers)) {
      if (peer.connection) {
        // Kiểm tra rõ ràng peer.connection có tồn tại không
        const sender = peer.connection
          .getSenders()
          .find((s) => s.track?.kind === videoTrack.kind);
        if (sender) {
          return sender; // Trả về ngay khi tìm thấy sender
        }
      }
    }
    return null;
  }
  //---------------code moi
  private checkParticipantsAndSwitch(): void {
    const participantCount = Object.keys(this.peers).length;
    console.log("nguoi tham gia o day",participantCount)
    if (participantCount > this.maxMeshParticipants && !this.usingLiveKit) {
      this.switchToLiveKit();
    } else if (
      participantCount <= this.maxMeshParticipants &&
      this.usingLiveKit
    ) {
      this.switchToMesh();
    }
  }

  private async switchToLiveKit(): Promise<void> {
    this.usingLiveKit = true;
    await this.cleanupMeshConnections();
    await this.connectToLiveKit();
  }

  private async switchToMesh(): Promise<void> {
    this.usingLiveKit = false;
    if (this.livekitRoom) {
      this.livekitRoom.disconnect();
    }
    const hubConnection = this.roomHubService.getConnection();
    await hubConnection.invoke('GetExistingPeers');
  }

  private async cleanupMeshConnections(): Promise<void> {
    Object.values(this.peers).forEach((peer) => {
      if (peer.connection) {
        peer.connection.close();
      }
    });
    this.peers = {};
    this.updatePeersSubject();
  }

  private async connectToLiveKit(): Promise<void> {
    try {
      console.log('🚀 Initializing LiveKit connection...');

      this.livekitRoom = new Room();
      console.log('✅ LiveKit Room instance created');

      this.liveKitToken = await this.roomHubService.fetchLiveKitToken();
      console.log('🔑 Received LiveKit token:', this.liveKitToken);

      console.log('🌍 Connecting to LiveKit server:', this.liveKitUrl);
      await this.livekitRoom.connect(this.liveKitUrl, this.liveKitToken, {
        autoSubscribe: true, // Đảm bảo subscribe tất cả track từ remote participant
      });
      console.log('✅ Successfully connected to LiveKit!');

      const localStream = this.roomHubService.getLocalStream();
      console.log('🎥 Retrieved local stream:', localStream);

      if (localStream) {
        for (const track of localStream.getTracks()) {
          // Kiểm tra trạng thái của từng track theo loại
          if (track.kind === 'video' && !this.roomHubService.videoEnabled) {
            console.log('📡 Video track is disabled, skipping publish.');
            continue; // Bỏ qua nếu camera bị tắt
          }
          if (track.kind === 'audio' && !this.roomHubService.audioEnabled) {
            console.log('📡 Audio track is disabled, skipping publish.');
            continue; // Bỏ qua nếu mic bị tắt
          }
          console.log(`📡 Publishing track: ${track.kind}`);
          await this.livekitRoom.localParticipant.publishTrack(track);
          console.log(`✅ Published ${track.kind} track successfully`);
        }
      }

      // Cài đặt các sự kiện của LiveKit
      this.livekitRoom
        .on('participantConnected', (participant) => {
          console.log(`👤 Participant connected: ${participant.identity}`);
          // Xử lý các track đã có của participant
          Array.from(participant.trackPublications.values()).forEach(
            (publication) => {
              if (publication.isSubscribed && publication.track) {
                this.handleLiveKitTrack(publication.track, participant);
              }
            }
          );
          this.updateLiveKitParticipants();
        })
        .on('participantDisconnected', (participant) => {
          console.log(`🚪 Participant disconnected: ${participant.identity}`);
          this.updateLiveKitParticipants();
        })
        .on('trackSubscribed', (track, publication, participant) => {
          console.log(
            `🎧 Track subscribed: ${track.kind} from ${participant.identity}`
          );
          this.handleLiveKitTrack(track, participant);
        });

      this.updateLiveKitParticipants();
      console.log('🔄 LiveKit participants updated');
    } catch (error) {
      console.error('❌ Error connecting to LiveKit:', error);
      this.usingLiveKit = false;
    }
  }

  private handleLiveKitTrack(
    track: Track,
    participant: RemoteParticipant
  ): void {
    this.cdr.run(() => {
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      // Check if peer already exists
      let peer = this.peers[participant.identity];

      if (!peer) {
        // Create new peer if it doesn't exist
        peer = {
          peerId: participant.identity,
          userName: participant.name || participant.identity,
          stream: new MediaStream([track.mediaStreamTrack]),
        };
        this.peers[participant.identity] = peer;
      } else if (peer.stream) {
        // Add track to existing stream if the peer already has a stream
        peer.stream.addTrack(track.mediaStreamTrack);
      } else {
        // Create a new stream if the peer exists but doesn't have a stream
        peer.stream = new MediaStream([track.mediaStreamTrack]);
      }

      console.log(
        `Updated peer with stream: ${participant.identity}, kind: ${track.kind}`
      );
      this.updatePeersSubject();
    }
  })}

  private updateLiveKitParticipants(): void {
    if (!this.usingLiveKit) return;

    this.cdr.run(() => {
      const remoteParticipants = this.livekitRoom.remoteParticipants;

      // First, ensure existing peers are updated correctly
      remoteParticipants.forEach((participant) => {
        if (!this.peers[participant.identity]) {
          // Add new peer if not already present
          this.peers[participant.identity] = {
            peerId: participant.identity,
            userName: participant.name || participant.identity,
          };

          // If participant already has published tracks, handle them
          Array.from(participant.trackPublications.values()).forEach(
            (publication) => {
              if (publication.track && publication.isSubscribed) {
                this.handleLiveKitTrack(publication.track, participant);
              }
            }
          );
        } else {
          // Update the existing peer if needed
          const peer = this.peers[participant.identity];
          if (participant.trackPublications.size === 0) {
            // If the participant has no track publications, disconnect and remove from peers
            delete this.peers[participant.identity];
            console.log(`Participant ${participant.identity} disconnected (no tracks)`);
          } else {
            // Handle the tracks of the existing peer
            Array.from(participant.trackPublications.values()).forEach((publication) => {
              if (publication.track && publication.isSubscribed) {
                this.handleLiveKitTrack(publication.track, participant);
              }
            });
          }
        }
      });

      // Remove disconnected participants from peers list
      Object.keys(this.peers).forEach((peerId) => {
        const peer = this.peers[peerId];
        // Sử dụng Array.from() để chuyển Map thành mảng và kiểm tra peerId
        if (!Array.from(this.livekitRoom.remoteParticipants.keys()).includes(peerId)) {
          // Remove the peer if no longer in the remoteParticipants list
          delete this.peers[peerId];
          console.log(`Peer ${peerId} removed from peers list`);
        }
      });

      // Finally update the peers subject
      this.updatePeersSubject();
    });
  }


  public async toggleVideo(): Promise<void> {
    if (this.roomHubService.localStream) {
      // Đảo ngược trạng thái video
      this.roomHubService._videoEnabled = !this.roomHubService._videoEnabled;
      const videoTracks = this.roomHubService.localStream.getVideoTracks();
      for (const track of videoTracks) {
        track.enabled = this.roomHubService._videoEnabled;
        const sender = this.getRTCSender(track);
        if (this.roomHubService._videoEnabled) {
          // Khi bật camera: nếu có sender thì replaceTrack, còn không thì publish lại track
          if (sender) {
            await sender.replaceTrack(track);
            console.log("📹 Video track updated via replaceTrack.");
          } else if (this.livekitRoom && this.livekitRoom.localParticipant) {
            await this.livekitRoom.localParticipant.publishTrack(track);
            console.log("📹 Video track published again.");
          }
        } else {
          // Khi tắt camera: chỉ cập nhật trạng thái qua replaceTrack nếu có sender
          if (sender) {
            await sender.replaceTrack(track);
            console.log("📹 Video track updated (disabled).");
          }
        }
      }
      console.log(`📹 Video ${this.roomHubService._videoEnabled ? 'enabled' : 'disabled'}`);
    }
  }

  public async toggleAudio(): Promise<void> {
    if (this.roomHubService.localStream) {
      // Đảo ngược trạng thái audio
      this.roomHubService._audioEnabled = !this.roomHubService._audioEnabled;
      const audioTracks = this.roomHubService.localStream.getAudioTracks();
      for (const track of audioTracks) {
        track.enabled = this.roomHubService._audioEnabled;
        const sender = this.getRTCSender(track);
        if (this.roomHubService._audioEnabled) {
          if (sender) {
            await sender.replaceTrack(track);
            console.log("🎤 Audio track updated via replaceTrack.");
          } else if (this.livekitRoom && this.livekitRoom.localParticipant) {
            await this.livekitRoom.localParticipant.publishTrack(track);
            console.log("🎤 Audio track published again.");
          }
        } else {
          if (sender) {
            await sender.replaceTrack(track);
            console.log("🎤 Audio track updated (disabled).");
          }
        }
      }
      console.log(`🎤 Audio ${this.roomHubService._audioEnabled ? 'enabled' : 'disabled'}`);
    }
  }


}
