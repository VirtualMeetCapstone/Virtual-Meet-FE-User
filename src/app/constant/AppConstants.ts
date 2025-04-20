export class AppConstants {
  static readonly API_LOCAL_BASE_URL = 'https://localhost:7035';
  static readonly API_BASE_URL_HTTPS = 'https://dev-vmeet2.runasp.net';
  static readonly API_WSS_LIVE_KIT  = 'wss://vmeet-6zijw0nw.livekit.cloud';

  static addTimeStampUrl(endpoint: string): string {
    const timestamp = new Date().getTime();
    return endpoint.includes('?') ? `${endpoint}&ts=${timestamp}` : `${endpoint}?ts=${timestamp}`;
  }

  static config = {
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
}
