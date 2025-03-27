import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatServicesService {

  constructor() { }
  private messagesMap = new Map<string, any[]>(); // Map lưu tin nhắn theo roomId

  saveMessages(roomId: string, messages: any[]): void {
    const existingMessages = this.messagesMap.get(roomId) || [];

    messages.forEach(msg => {
      if (!existingMessages.some(existingMsg => existingMsg.id === msg.id)) {
        existingMessages.push(msg);
      }
    });

    this.messagesMap.set(roomId, existingMessages);
  }

  getMessages(roomId: string): any[] {
    return this.messagesMap.get(roomId) || [];
  }

  clearMessages(roomId: string): void {
    this.messagesMap.delete(roomId);
  }
}
