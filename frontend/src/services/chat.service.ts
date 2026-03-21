import api from './api';
import { ChatMessage, ChatSession } from '../types';

class ChatService {
  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return api.get<ChatSession[]>(`/chat/sessions?userId=${userId}`);
  }

  async getChatSession(sessionId: number): Promise<ChatSession> {
    return api.get<ChatSession>(`/chat/sessions/${sessionId}`);
  }

  async createChatSession(participantId: number): Promise<ChatSession> {
    return api.post<ChatSession>('/chat/sessions', { participantId });
  }

  async sendMessage(sessionId: number, message: string): Promise<ChatMessage> {
    return api.post<ChatMessage>('/chat/messages', {
      sessionId,
      message,
    });
  }

  async getMessages(sessionId: number): Promise<ChatMessage[]> {
    return api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  }

  async markAsRead(messageId: number): Promise<ChatMessage> {
    return api.put<ChatMessage>(`/chat/messages/${messageId}`, {
      isRead: true,
    });
  }

  async deleteChatSession(sessionId: number): Promise<void> {
    return api.delete(`/chat/sessions/${sessionId}`);
  }
}

export default new ChatService();
