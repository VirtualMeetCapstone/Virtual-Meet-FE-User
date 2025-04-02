export interface Peer {
  peerId: string;
  userName: string;
  connection?: RTCPeerConnection;
  stream?: MediaStream;
}
