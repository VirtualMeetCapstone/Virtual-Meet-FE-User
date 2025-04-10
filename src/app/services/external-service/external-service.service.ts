import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class ExternalServiceService {
  constructor(private sanitizer: DomSanitizer) {}

  //use it when get error or json photo: UNSAFE
  getSafeUrl(url: any): SafeUrl {
    // console.log('url', url);
    if (!url) return 'assets/images/default-avatar.png';

    // console.log(url);

    try {
      if (
        typeof url === 'string' &&
        (url.startsWith('data:image') || url.startsWith('http'))
      ) {
        return this.sanitizer.bypassSecurityTrustUrl(url);
      }
      const parsed = typeof url === 'string' ? JSON.parse(url) : url;
      return this.sanitizer.bypassSecurityTrustUrl(parsed.Url);
    } catch (error) {
      return 'assets/images/default-avatar.png';
    }
  }
}
