export interface Peer {
  peerId: string;
  userName: string;
  avatarUrl?: string;
  userId?: string;
  connection?: RTCPeerConnection;
  stream?: MediaStream;
  isDisconnected?: boolean;
}
