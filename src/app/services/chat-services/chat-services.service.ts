import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatServicesService {

  constructor() { }
  private messagesMap = new Map<string, any[]>(); // Map lưu tin nhắn theo roomId

  saveMessages(roomId: string, messages: any[]): void {
    const existingMessages = this.messagesMap.get(roomId) || [];
    const newMessages = [...existingMessages, ...messages.filter(msg => !existingMessages.includes(msg))];
    this.messagesMap.set(roomId, newMessages);
  }

  getMessages(roomId: string): any[] {
    return this.messagesMap.get(roomId) || [];
  }

  clearMessages(roomId: string): void {
    this.messagesMap.delete(roomId);
  }
}
