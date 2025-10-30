import { v4 as uuidv4 } from 'uuid';
import { EmulatorSession, TelegramUser, TelegramChat, TelegramMessage, BotConfig } from '../types/telegram';
import logger from '../utils/logger';

export class SessionManager {
  private sessions: Map<string, EmulatorSession> = new Map();

  createSession(botConfig: BotConfig): string {
    const sessionId = uuidv4();
    const session: EmulatorSession = {
      id: sessionId,
      botConfig,
      users: new Map(),
      chats: new Map(),
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);
    logger.info(`Created new session: ${sessionId} for bot: ${botConfig.username}`);
    
    return sessionId;
  }

  getSession(sessionId: string): EmulatorSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.info(`Deleted session: ${sessionId}`);
    }
    return deleted;
  }

  listSessions(): EmulatorSession[] {
    return Array.from(this.sessions.values());
  }

  addUser(sessionId: string, user: TelegramUser): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.users.set(user.id, user);
    return true;
  }

  addChat(sessionId: string, chat: TelegramChat): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.chats.set(chat.id, chat);
    return true;
  }

  addMessage(sessionId: string, message: TelegramMessage): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.messages.push(message);
    
    // Keep only last 1000 messages to prevent memory issues
    if (session.messages.length > 1000) {
      session.messages = session.messages.slice(-1000);
    }

    return true;
  }

  getMessages(sessionId: string, limit: number = 50): TelegramMessage[] {
    const session = this.getSession(sessionId);
    if (!session) return [];

    return session.messages.slice(-limit);
  }

  // Cleanup old sessions (older than 24 hours)
  cleanupOldSessions(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoff) {
        this.deleteSession(sessionId);
      }
    }
  }
}

export const sessionManager = new SessionManager();
