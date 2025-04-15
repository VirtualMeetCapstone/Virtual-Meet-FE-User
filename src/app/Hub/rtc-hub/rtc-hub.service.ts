import { ChangeDetectorRef, Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoomHubService } from '../room-hub/room-hub.service';
import { Peer } from '../../models/rtc/pere';
import {
  Room,
  RemoteParticipant,
  Track,
  LocalTrackPublication,
} from 'livekit-client';
import { AppConstants } from '../../constant/AppConstants';
@Injectable({
  providedIn: 'root',
})
export class RtcHubService {
  public peers: { [key: string]: Peer } = {};
  private peersSubject = new BehaviorSubject<Peer[]>([]);
  private screenStream!: MediaStream | null;
  private mediaRecorder!: MediaRecorder | null;
  private recordedChunks: Blob[] = [];
  public isRecording = false;
  private recordingSubject = new BehaviorSubject<boolean>(false);

  // LiveKit properties
  private livekitRoom!: Room;
  private liveKitUrl = AppConstants.API_WSS_LIVE_KIT;
  private liveKitToken = '';
  private maxMeshParticipants = 4;
  private usingLiveKit = false;

  private originalVideoTrack: MediaStreamTrack | null = null;
  private screenTrack: any;
  private config = AppConstants.config;
  private connectionId: string | null = null;

  constructor(public roomHubService: RoomHubService, private cdr: NgZone) {
    this.setupRtcEvents();
  }

  get peers$(): Observable<Peer[]> {
    return this.peersSubject.asObservable();
  }
  getPeerConnection(peerId: string): RTCPeerConnection | null {
    const peer = this.peers[peerId];
    return peer?.connection || null;
  }

  public getConnectionId(): string | null {
    return this.connectionId;
  }

  // Setup WebRTC-related SignalR events
  private setupRtcEvents(): void {
    const hubConnection = this.roomHubService.getConnection();
    if (this.usingLiveKit) {
      console.log('dung live kit');
      return;
    }

    hubConnection.on('ExistingPeers', (peerList: any[]) => {
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

    this.roomHubService.receiveConnectionID((connectionId: string) => {
      console.log('🔌 Nhận được connectionId:', connectionId);
      this.connectionId = connectionId;
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
    });
  }

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
          frameRate: { ideal: 15, max: 20 },
        },
        audio: true,
      });
      this.screenTrack = this.screenStream.getVideoTracks()[0];
      // Hiển thị màn hình đã chia sẻ cho chính người dùng
      const screenPreview = document.getElementById(
        'localScreenPreview'
      ) as HTMLVideoElement;
      if (screenPreview) {
        screenPreview.srcObject = this.screenStream;
        screenPreview.play();
      }

      if (this.usingLiveKit) {
        this.livekitRoom.localParticipant.publishTrack(
          this.screenStream.getVideoTracks()[0]
        );
        console.log('📡 Đã bắt đầu chia sẻ màn hình với LiveKit!');
      } else {
        // Gửi stream màn hình chia sẻ tới các peer trong Mesh
        Object.values(this.peers).forEach((peer) => {
          const sender = peer.connection
            ?.getSenders()
            .find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(this.screenStream!.getVideoTracks()[0]);
          }
        });
        console.log('📡 Đã bắt đầu chia sẻ màn hình với Mesh!');
      }

      console.log('📡 Đã bắt đầu chia sẻ màn hình!');
    } catch (error) {
      console.error('❌ Lỗi khi chia sẻ màn hình:', error);
    }
  }
  stopScreenShare() {
    if (this.screenStream) {
      // Dừng các track của màn hình chia sẻ
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;

      // Lấy lại local stream (video từ camera)
      const localStream = this.roomHubService.getLocalStream();

      if (localStream) {
        // Kiểm tra nếu đang sử dụng LiveKit và cập nhật track mới
        if (this.usingLiveKit && this.livekitRoom) {
          // Unpublish track chia sẻ màn hình nếu có
          if (this.screenTrack) {
            this.livekitRoom.localParticipant.unpublishTrack(this.screenTrack);
          }
        } else {
          // Trường hợp không dùng LiveKit, chỉ cần cập nhật lại peer connection
          Object.values(this.peers).forEach((peer) => {
            const sender = peer.connection
              ?.getSenders()
              .find((s) => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(localStream.getVideoTracks()[0]);
            }
          });
          console.log('📡 Đã chuyển lại camera thay vì màn hình chia sẻ.');
        }
      } else {
        console.error('❌ Không tìm thấy localStream để thay thế track video.');
      }

      console.log('🛑 Đã dừng chia sẻ màn hình!');
    } else {
      console.log('🛑 Không có màn hình chia sẻ nào để dừng.');
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
    // Kiểm tra nếu dùng LiveKit
    if (this.livekitRoom && this.livekitRoom.localParticipant) {
      const publication: LocalTrackPublication | undefined =
        this.livekitRoom.localParticipant.getTrackPublication(
          videoTrack.kind === 'video'
            ? Track.Source.Camera
            : Track.Source.Microphone
        );

      if (publication && publication.track?.mediaStreamTrack === videoTrack) {
        console.log(
          '🔍 Found LiveKit publication for track ID:',
          videoTrack.id
        );
        return null;
      } else {
        console.log(
          '❌ No matching LiveKit publication for track ID:',
          videoTrack.id
        );
        return null;
      }
    }

    // Fallback về WebRTC thuần
    for (const peer of Object.values(this.peers)) {
      if (peer.connection) {
        const sender = peer.connection
          .getSenders()
          .find((s) => s.track === videoTrack); // So sánh trực tiếp track
        if (sender) {
          console.log('🔍 Found WebRTC sender for track ID:', videoTrack.id);
          return sender;
        }
      }
    }
    console.log('❌ No sender found for track ID:', videoTrack.id);
    return null;
  }
  //---------------code moi
  private checkParticipantsAndSwitch(): void {
    const participantCount = Object.keys(this.peers).length;
    console.log('nguoi tham gia o day', participantCount);
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
          if (this.peers[participant.identity]) {
            delete this.peers[participant.identity];
            console.log(`Peer ${participant.identity} removed immediately`);
          }
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
    });
  }

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
            // Don't immediately disconnect if no tracks, just mark as disconnected
            peer.isDisconnected = true;
            console.log(
              `Participant ${participant.identity} disconnected (no tracks)`
            );
          } else {
            // Ensure the peer is connected if tracks are available
            peer.isDisconnected = false;

            // Handle the tracks of the existing peer
            Array.from(participant.trackPublications.values()).forEach(
              (publication) => {
                if (publication.track && publication.isSubscribed) {
                  this.handleLiveKitTrack(publication.track, participant);
                }
              }
            );
          }
        }
      });

      // Remove disconnected participants from peers list after checking
      Object.keys(this.peers).forEach((peerId) => {
        const peer = this.peers[peerId];
        if (
          peer.isDisconnected &&
          !Array.from(this.livekitRoom.remoteParticipants.keys()).includes(
            peerId
          )
        ) {
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
      if (!this.roomHubService.localStream) {
        return;
      }

      // Lật trạng thái video: nếu đang tắt thì bật, nếu bật thì tắt
      this.roomHubService._videoEnabled = !this.roomHubService._videoEnabled;

      // Lấy danh sách video tracks hiện có
      let videoTracks = this.roomHubService.localStream.getVideoTracks();

      // Nếu người dùng muốn bật video nhưng chưa có video track, yêu cầu tạo mới
      if (this.roomHubService._videoEnabled && videoTracks.length === 0) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          const newVideoTracks = newStream.getVideoTracks();
          newVideoTracks.forEach((track) => {
            this.roomHubService.localStream!.addTrack(track);
            videoTracks.push(track);
          });
        } catch (err) {
          console.error('❌ Không thể lấy video track:', err);
          return;
        }
      }

      // Nếu vẫn không có video track sau khi yêu cầu, thoát hàm
      if (videoTracks.length === 0) {
        console.warn('❌ Không có video track để thay đổi trạng thái.');
        return;
      }

      // Lặp qua tất cả các video tracks để bật/tắt theo trạng thái mới
      for (const track of videoTracks) {
        track.enabled = this.roomHubService._videoEnabled;

        // Nếu đang sử dụng livekit để publish track
        if (this.livekitRoom && this.livekitRoom.localParticipant) {
          const publication =
            this.livekitRoom.localParticipant.getTrackPublication(
              track.kind === 'video'
                ? Track.Source.Camera
                : Track.Source.Microphone
            );
          if (this.roomHubService._videoEnabled) {
            if (publication) {
              // Nếu track đã publish, chỉ cần set track.enabled
            } else if (this.livekitRoom.state === 'connected') {
              try {
                await this.livekitRoom.localParticipant.publishTrack(track);
              } catch (err) {
                // Xử lý lỗi nếu cần
              }
            }
          } else {
            // Nếu tắt video, có thể unpublish track nếu framework hỗ trợ
            // (tuỳ vào API của LiveKit)
          }
        } else {
          // Nếu không dùng livekit, kiểm tra và thay thế track cho RTCPeerConnection
          const sender = this.getRTCSender(track);
          if (this.roomHubService._videoEnabled) {
            if (sender) {
              try {
                await sender.replaceTrack(track);
              } catch (err) {
                // Xử lý lỗi nếu cần
              }
            } else {
              for (const peer of Object.values(this.peers)) {
                if (
                  peer.connection &&
                  peer.connection.connectionState === 'connected'
                ) {
                  peer.connection.addTrack(
                    track,
                    this.roomHubService.localStream
                  );
                  break;
                }
              }
            }
          }
        }
      }

      await this.roomHubService.sendVideoStatus(this.roomHubService._videoEnabled);

    }

    // Bật/tắt audio
    public async toggleAudio(): Promise<void> {
      if (!this.roomHubService.localStream) {
        return;
      }

      // Lật trạng thái audio: nếu đang tắt thì bật, nếu bật thì tắt
      this.roomHubService._audioEnabled = !this.roomHubService._audioEnabled;

      // Lấy danh sách audio tracks hiện có
      let audioTracks = this.roomHubService.localStream.getAudioTracks();

      // Nếu người dùng muốn bật audio mà chưa có audio track, yêu cầu tạo mới
      if (this.roomHubService._audioEnabled && audioTracks.length === 0) {
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const newAudioTracks = newStream.getAudioTracks();
          newAudioTracks.forEach((track) => {
            this.roomHubService.localStream!.addTrack(track);
            audioTracks.push(track);
          });


        } catch (err) {
          console.error('❌ Không thể lấy audio track:', err);
          return;
        }
      }

      // Nếu sau khi cố gắng vẫn không có audio track thì thoát hàm
      if (audioTracks.length === 0) {
        console.warn('❌ Không có audio track để thay đổi trạng thái.');
        return;
      }

      // Lặp qua tất cả các audio tracks để bật/tắt theo trạng thái mới
      for (const track of audioTracks) {
        track.enabled = this.roomHubService._audioEnabled;

        if (this.livekitRoom && this.livekitRoom.localParticipant) {
          const publication =
            this.livekitRoom.localParticipant.getTrackPublication(
              track.kind === 'audio'
                ? Track.Source.Microphone
                : Track.Source.Camera
            );
          if (this.roomHubService._audioEnabled) {
            if (publication) {
              // Track đã được publish, chỉ cần set track.enabled
            } else if (this.livekitRoom.state === 'connected') {
              try {
                await this.livekitRoom.localParticipant.publishTrack(track);
              } catch (err) {
                // Xử lý lỗi im lặng, có thể thêm logic retry nếu cần
              }
            }
          }
        } else {
          const sender = this.getRTCSender(track);
          if (this.roomHubService._audioEnabled) {
            if (sender) {
              try {
                await sender.replaceTrack(track);
              } catch (err) {
                // Xử lý lỗi im lặng
              }
            } else {
              for (const peer of Object.values(this.peers)) {
                if (
                  peer.connection &&
                  peer.connection.connectionState === 'connected'
                ) {
                  peer.connection.addTrack(
                    track,
                    this.roomHubService.localStream
                  );
                  break;
                }
              }
            }
          }
        }
      }
      await this.roomHubService.sendMicStatus(this.roomHubService._audioEnabled);
    }

    public async forceMute(): Promise<void> {
      if (!this.roomHubService.localStream) {
        console.warn('⚠️ Không tìm thấy localStream để tắt tiếng.');
        return;
      }

      this.roomHubService._audioEnabled = false;

      const audioTracks = this.roomHubService.localStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('⚠️ Không có audio tracks để tắt.');
        return;
      }

      for (const track of audioTracks) {
        track.enabled = false; // Tắt track
        console.log(`🔇 Đã tắt audio track: ${track.id}`);
      }
      await this.roomHubService.sendMicStatus(false);
    }

    public async forceCamera(): Promise<void> {
      if (!this.roomHubService.localStream) {
        console.warn('⚠️ Không tìm thấy localStream để tắt camera.');
        return;
      }

      this.roomHubService._videoEnabled = false;

      const videoTracks = this.roomHubService.localStream.getVideoTracks();
      if (videoTracks.length === 0) {
        console.warn('⚠️ Không có video tracks để tắt.');
        return;
      }

      for (const track of videoTracks) {
        track.enabled = false; // Tắt track video
        console.log(`📷 Đã tắt video track: ${track.id}`);
      }

      await this.roomHubService.sendVideoStatus(false);
    }

    public async forceUnmute(): Promise<void> {
      if (!this.roomHubService.localStream) {
        console.warn('⚠️ Không tìm thấy localStream để bật mic.');
        return;
      }

      this.roomHubService._audioEnabled = true;

      const audioTracks = this.roomHubService.localStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('⚠️ Không có audio tracks để bật.');
        return;
      }

      for (const track of audioTracks) {
        track.enabled = true;
        console.log(`🎤 Đã bật lại audio track: ${track.id}`);
      }

      await this.roomHubService.sendMicStatus(true);
    }

    public async forceCameraOn(): Promise<void> {
      if (!this.roomHubService.localStream) {
        console.warn('⚠️ Không tìm thấy localStream để bật camera.');
        return;
      }

      this.roomHubService._videoEnabled = true;

      const videoTracks = this.roomHubService.localStream.getVideoTracks();
      if (videoTracks.length === 0) {
        console.warn('⚠️ Không có video tracks để bật.');
        return;
      }

      for (const track of videoTracks) {
        track.enabled = true;
        console.log(`📸 Đã bật lại video track: ${track.id}`);
      }

      await this.roomHubService.sendVideoStatus(true);
    }



  public async leaveRoom(): Promise<void> {
    if (this.usingLiveKit && this.livekitRoom) {
      try {
        await this.livekitRoom.disconnect();
        console.log('🛑 Disconnected from LiveKit room.');
      } catch (error) {
        console.error('❌ Lỗi khi rời phòng LiveKit:', error);
      }
    }
    this.roomHubService.leaveRoom();
  }




}
