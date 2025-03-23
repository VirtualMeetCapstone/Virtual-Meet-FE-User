import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | number): string {
    if (!value) {
      return '';
    }

    let createdDate: Date;
    // Nếu value đã là Date, dùng trực tiếp; nếu là số, chuyển đổi thành Date
    if (value instanceof Date) {
      createdDate = value;
    } else {
      createdDate = new Date(value);
    }

    // Nếu ngày không hợp lệ thì trả về chuỗi rỗng
    if (isNaN(createdDate.getTime())) {
      return '';
    }

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
