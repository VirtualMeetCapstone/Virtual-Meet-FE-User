import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';
import { AppConstants } from '../../constant/AppConstants';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Peer {
  peerId: string;
  userName: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

@Injectable({
  providedIn: 'root',
})
export class RoomHubService {
  public hubConnection: signalR.HubConnection;
  public currentUser = { name: '', roomId: '' };
  private peers: { [key: string]: Peer } = {};
  private localStream: MediaStream | null = null;
  private _audioEnabled = true;
  private _videoEnabled = true;

  // Create observable subjects for UI updates
  private participantsSubject = new BehaviorSubject<number>(0);
  private peersSubject = new BehaviorSubject<Peer[]>([]);
  private connectionStateSubject = new BehaviorSubject<string>('disconnected');

  // ICE server configuration
  private config = {
    iceServers: [
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.cloudflare.com:53' },
      {
        urls: 'turn:turn.cloudflare.com:3478?transport=udp',
        username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a'
      },
      {
        urls: 'turn:turn.cloudflare.com:53?transport=udp',
        username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a'
      },
      {
        urls: 'turn:turn.cloudflare.com:3478?transport=tcp',
        username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a'
      },
      {
        urls: 'turn:turn.cloudflare.com:80?transport=tcp',
        username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a'
      },
      {
        urls: 'turn:turn.cloudflare.com:5349?transport=tcp',
        username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a'
      },
      {
        urls: 'turns:turn.cloudflare.com:443?transport=tcp',
        username: 'g01acb757a67a27ee8ea7908f31a697792d0c680fb8bf627a82a9a216edb3359',
        credential: '33b8f21814e3dc5419ebf7ab84570201c038157e59320760e077da01b65a0f7a'
      }
    ]
  };

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${AppConstants.API_BASE_URL_HTTPS}/roomHub`, {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    // Setup WebRTC and SignalR events
    this.setupSignalREvents();
  }

  // Public observables that components can subscribe to
  get participants$(): Observable<number> {
    return this.participantsSubject.asObservable();
  }

  get peers$(): Observable<Peer[]> {
    return this.peersSubject.asObservable();
  }

  get connectionState$(): Observable<string> {
    return this.connectionStateSubject.asObservable();
  }

  get isInRoom(): boolean {
    return !!this.currentUser.roomId;
  }

  get audioEnabled(): boolean {
    return this._audioEnabled;
  }

  get videoEnabled(): boolean {
    return this._videoEnabled;
  }

  getConnection(): signalR.HubConnection {
    return this.hubConnection;
  }

  // Improved connection method
  public startConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        this.connectionStateSubject.next('connected');
        resolve();
        return;
      }

      this.hubConnection.start()
        .then(() => {
          console.log("✅ SignalR connection established");
          this.connectionStateSubject.next('connected');
          resolve();
        })
        .catch(err => {
          console.error("❌ Connection failed:", err);
          this.connectionStateSubject.next('error');
          reject(err);
        });
    });
  }

  // Setup all SignalR event handlers
  private setupSignalREvents(): void {
    // Room state events
    this.hubConnection.on("ReceiveRoomState", (state) => {
      console.log("📦 Received room state:", state);
    });

    this.hubConnection.on('RoomStateUpdated', (state) => {
      console.log("🔄 Room state updated:", state);
    });

    // Video sync events
    this.hubConnection.on('ReceiveSelectedVideo', (roomId: string, videoId: string, timestamp: number, isPaused: boolean) => {
      console.log(`📨 Received video event - Room: ${roomId}, Video: ${videoId}, Time: ${timestamp}s, Paused: ${isPaused}`);
    });

    this.hubConnection.on('receiveplayerstatus', (roomId, status, time) => {
      console.log(`📡 Received player status: ${status}, time: ${time}s`);
    });

    // WebRTC events
    this.hubConnection.on('ExistingPeers', (peerList: any[]) => {
      this.participantsSubject.next(peerList.length + 1); // +1 for self

      peerList.forEach(peer => {
        console.log('Connecting to existing peer:', peer.peerId);
        this.createPeerConnection(peer.peerId, peer.userName, true);
      });
    });

    this.hubConnection.on('NewPeer', (peerId: string, peerName: string, participantCount: number) => {
      console.log('New peer joined:', peerId, peerName);
      this.participantsSubject.next(participantCount);
      this.createPeerConnection(peerId, peerName, false);
    });

    this.hubConnection.on('ReceiveOffer', async (peerId: string, peerName: string, offer: string) => {
      try {
        // Create a peer connection if it doesn't exist
        let peer = this.peers[peerId] || this.createPeerConnection(peerId, peerName, false);

        // Set the remote description (the offer)
        await peer.connection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));

        // Create and set local description (the answer)
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);

        // Send the answer back
        await this.hubConnection.invoke('SendAnswer', peerId, JSON.stringify(answer));
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    this.hubConnection.on('ReceiveAnswer', async (peerId: string, answer: string) => {
      try {
        if (this.peers[peerId]) {
          await this.peers[peerId].connection.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(answer))
          );
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    this.hubConnection.on('ReceiveCandidate', async (peerId: string, candidate: string) => {
      try {
        if (this.peers[peerId]) {
          await this.peers[peerId].connection.addIceCandidate(
            new RTCIceCandidate(JSON.parse(candidate))
          );
        }
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    });

    this.hubConnection.on('PeerDisconnected', (peerId: string, participantCount: number) => {
      console.log('Peer disconnected:', peerId);
      this.participantsSubject.next(participantCount);

      // Clean up the peer connection
      if (this.peers[peerId]) {
        this.peers[peerId].connection.close();
        delete this.peers[peerId];
        this.updatePeersSubject();
      }
    });

    this.hubConnection.onclose(error => {
      console.log('SignalR connection closed', error);
      this.connectionStateSubject.next('disconnected');

      if (this.currentUser.roomId) {
        // Alert handled in component
        this.currentUser.roomId = '';
      }
    });

    // Social events
    this.hubConnection.on('ReceiveLike', (username: string) => {
      console.log(`👍 Received like from ${username}`);
    });

    this.hubConnection.on('ReceiveShare', (username: string) => {
      console.log(`🔗 Received share from ${username}`);
    });
  }

  // Create a new peer connection
  private createPeerConnection(peerId: string, peerName: string, initiator: boolean): Peer {
    const peerConnection = new RTCPeerConnection(this.config);

    const peer: Peer = {
      peerId,
      userName: peerName,
      connection: peerConnection
    };

    this.peers[peerId] = peer;

    // Add all local tracks to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming streams
    peerConnection.ontrack = event => {
      peer.stream = event.streams[0];
      this.updatePeersSubject();
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        this.hubConnection.invoke('SendCandidate', peerId, JSON.stringify(event.candidate))
          .catch(err => console.error('Error sending ICE candidate:', err));
      }
    };

    // Connection state monitoring
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with peer ${peerId} changed to: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        // Clean up if connection fails or closes
        delete this.peers[peerId];
        this.updatePeersSubject();
      }
    };

    // If this peer is the initiator, create and send offer
    if (initiator) {
      peerConnection.createOffer()
        .then(offer => {
          return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
          this.hubConnection.invoke('SendOffer', peerId, JSON.stringify(peerConnection.localDescription))
            .catch(err => console.error('Error sending offer:', err));
        })
        .catch(err => {
          console.error('Error creating offer:', err);
        });
    }

    this.updatePeersSubject();
    return peer;
  }

  // Update the peers subject with the current list of peers
  private updatePeersSubject(): void {
    const peerList = Object.values(this.peers);
    this.peersSubject.next(peerList);
  }

  // Join a room with WebRTC capabilities
  public async joinRoom(username: string, roomId: string): Promise<void> {
    if (!roomId) {
      throw new Error('Room ID is required');
    }

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    }

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Set current user info
      this.currentUser.name = username;
      this.currentUser.roomId = roomId;

      // Join the room on the server
      await this.hubConnection.invoke('JoinRoom', username, roomId);
      console.log(`✅ Joined room ${roomId} as ${username}`);
    } catch (err) {
      console.error('❌ Error joining room:', err);
      throw err;
    }
  }

  // Leave the current room
  public async leaveRoom(): Promise<void> {
    if (!this.currentUser.roomId) return;

    // Close all peer connections
    Object.keys(this.peers).forEach(peerId => {
      if (this.peers[peerId]) {
        this.peers[peerId].connection.close();
        delete this.peers[peerId];
      }
    });

    // Leave the room on server
    await this.hubConnection.invoke('LeaveRoom', this.currentUser.roomId);

    // Reset state
    const roomId = this.currentUser.roomId;
    this.currentUser.roomId = '';
    this.currentUser.name = '';
    this.updatePeersSubject();
    this.participantsSubject.next(0);

    console.log(`✅ Left room ${roomId}`);

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Toggle audio
  public toggleAudio(): void {
    if (this.localStream) {
      this._audioEnabled = !this._audioEnabled;
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = this._audioEnabled;
      });
      console.log(`🎤 Audio ${this._audioEnabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Toggle video
  public toggleVideo(): void {
    if (this.localStream) {
      this._videoEnabled = !this._videoEnabled;
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = this._videoEnabled;
      });
      console.log(`📹 Video ${this._videoEnabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Get the local stream
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Social features
  public async sendLike(): Promise<void> {
    if (!this.currentUser.roomId) {
      console.error('❌ Not in a room');
      return;
    }
    await this.hubConnection.invoke('SendLike');
    console.log('👍 Like sent');
  }

  public async sendShare(): Promise<void> {
    if (!this.currentUser.roomId) {
      console.error('❌ Not in a room');
      return;
    }
    await this.hubConnection.invoke('SendShare');
    console.log('🔗 Share sent');
  }

  // Video sync features
  public async selectVideo(roomId: string, videoId: string): Promise<void> {
    console.log(`[HubService] Gửi video đã chọn cho room ${roomId}: ${videoId}`);
    try {
      await this.hubConnection.invoke('SelectVideo', roomId, videoId);
    } catch (err) {
      console.error('❌ Lỗi gửi video: ', err);
    }
  }

 // Gửi trạng thái player (play, pause, thời gian hiện tại)
 public async sendPlayerStatus(roomId: string, status: number, time: number): Promise<void> {
  if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
    console.error('❌ SignalR chưa kết nối, không thể gửi trạng thái!');
    return;
  }

  try {
    await this.hubConnection.invoke('UpdatePlayerStatus', roomId, status, time);
  } catch (err) {
    console.error('❌ Lỗi gửi trạng thái: ', err);
  }
}

  // Event registration methods
  public onRoomStateReceived(callback: (state: any) => void): void {
    this.hubConnection.off("ReceiveRoomState");
    this.hubConnection.on("ReceiveRoomState", (state) => {
      console.log("📦 Received room state:", state);
      callback(state);
    });
  }

  public onRoomStateUpdate(callback: (state: any) => void): void {
    this.hubConnection.off('RoomStateUpdated');
    this.hubConnection.on('RoomStateUpdated', callback);
  }

  public receiveLike(callback: (username: string) => void): void {
    this.hubConnection.off('ReceiveLike');
    this.hubConnection.on('ReceiveLike', callback);
  }

  public receiveShare(callback: (username: string) => void): void {
    this.hubConnection.off('ReceiveShare');
    this.hubConnection.on('ReceiveShare', callback);
  }

  public onVideoSelected(callback: (roomId: string, videoId: string, timestamp: number, isPaused: boolean) => void): void {
    this.hubConnection.off('ReceiveSelectedVideo');
    this.hubConnection.on('ReceiveSelectedVideo', (roomId: string, videoId: string, timestamp: number, isPaused: boolean) => {
      console.log(`📨 Received video event - Room: ${roomId}, Video: ${videoId}, Time: ${timestamp}s, Paused: ${isPaused}`);
      callback(roomId, videoId, timestamp, isPaused);
    });
  }

  public onPlayerStatusReceived(callback: (roomId: string, status: number, time: number) => void): void {
    this.hubConnection.off('receiveplayerstatus');
    this.hubConnection.on('receiveplayerstatus', (roomId, status, time) => {
      console.log(`📡 Received player status: ${status}, time: ${time}s`);
      callback(roomId, status, time);
    });
  }

  // WebRTC signal methods
  public async sendRTCSignal(method: string, data: any): Promise<void> {
    if (!this.currentUser.roomId) {
      console.error('❌ Not in a room');
      return;
    }
    await this.hubConnection.invoke(method, this.currentUser.roomId, JSON.stringify(data));
  }

  public onRTCSignal(event: string, callback: (data: any) => void): void {
    this.hubConnection.off(event);
    this.hubConnection.on(event, (data) => callback(JSON.parse(data)));
  }

  // Clean up resources
  public cleanup(): void {
    if (this.currentUser.roomId) {
      this.leaveRoom().catch(() => {});
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.hubConnection) {
      this.hubConnection.stop().catch(() => {});
    }

    // Reset state
    this.peers = {};
    this.updatePeersSubject();
    this.participantsSubject.next(0);
    this.connectionStateSubject.next('disconnected');
    console.log('🧹 Resources cleaned up');
  }
}
