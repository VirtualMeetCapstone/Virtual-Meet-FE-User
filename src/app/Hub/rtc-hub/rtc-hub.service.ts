import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RoomHubService } from '../room-hub/room-hub.service';
import { Peer } from '../../models/rtc/pere';

@Injectable({
  providedIn: 'root',
})
export class RtcHubService {
  private peers: { [key: string]: Peer } = {};
  private peersSubject = new BehaviorSubject<Peer[]>([]);

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

  constructor(private roomHubService: RoomHubService) {
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
      });
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
}
