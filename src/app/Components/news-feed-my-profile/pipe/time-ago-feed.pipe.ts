import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgoFeed',
})
export class TimeAgoFeedPipe implements PipeTransform {
  transform(value: number | Date): string {
    let createdDate: Date;
    if (typeof value === 'number') {
      // Giả sử value là .NET ticks
      const epochTicks = 621355968000000000;
      const ticksPerMillisecond = 10000;
      createdDate = new Date((value - epochTicks) / ticksPerMillisecond);
    } else {
      createdDate = value;
    }

    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();

    const hours = Math.floor(diffMs / 3600000);
    if (hours < 24) {
      return hours + ' giờ trước';
    }
    const days = Math.floor(diffMs / 86400000);
    return days + ' ngày trước';
  }
}
