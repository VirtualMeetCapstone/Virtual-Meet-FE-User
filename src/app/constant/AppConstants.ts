export class AppConstants {
  static readonly API_LOCAL_BASE_URL = 'https://localhost:7035';
  static readonly API_BASE_URL_HTTPS = 'https://dev-vmeet.site';
  static readonly API_BASE_URL_HTTP  = 'http://dev-vmeet.runasp.net';

  static addTimeStampUrl(endpoint: string): string {
    const timestamp = new Date().getTime();
    return endpoint.includes('?') ? `${endpoint}&ts=${timestamp}` : `${endpoint}?ts=${timestamp}`;
  }
}
