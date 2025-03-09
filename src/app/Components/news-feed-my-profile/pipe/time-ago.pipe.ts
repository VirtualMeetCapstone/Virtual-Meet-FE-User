import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(ticks: number): string {
    if (!ticks) {
      return '';
    }
    // Chuyển đổi .NET ticks sang Date
    const epochTicks = 621355968000000000;
    const ticksPerMillisecond = 10000;
    const msSinceEpoch = (ticks - epochTicks) / ticksPerMillisecond;
    const createdDate = new Date(msSinceEpoch);

    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) {
      return seconds + 's';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return minutes + 'm';
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return hours + 'h';
    }

    const days = Math.floor(hours / 24);
    return days + 'd';
  }
}
