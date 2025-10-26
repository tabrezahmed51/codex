import { SessionManager } from '../services/sessionManager';
import { BotConfig } from '../types/telegram';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const botConfig: BotConfig = {
        token: '123456789:ABCDEF1234567890abcdef1234567890abcdef',
        username: 'test_bot',
        commands: [],
      };

      const sessionId = sessionManager.createSession(botConfig);
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      
      const session = sessionManager.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.botConfig.username).toBe('test_bot');
    });
  });

  describe('getSession', () => {
    it('should return session if exists', () => {
      const botConfig: BotConfig = {
        token: '123456789:ABCDEF1234567890abcdef1234567890abcdef',
        username: 'test_bot',
        commands: [],
      };

      const sessionId = sessionManager.createSession(botConfig);
      const session = sessionManager.getSession(sessionId);
      
      expect(session).toBeDefined();
      expect(session?.id).toBe(sessionId);
    });

    it('should return undefined for non-existent session', () => {
      const session = sessionManager.getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', () => {
      const botConfig: BotConfig = {
        token: '123456789:ABCDEF1234567890abcdef1234567890abcdef',
        username: 'test_bot',
        commands: [],
      };

      const sessionId = sessionManager.createSession(botConfig);
      const deleted = sessionManager.deleteSession(sessionId);
      
      expect(deleted).toBe(true);
      
      const session = sessionManager.getSession(sessionId);
      expect(session).toBeUndefined();
    });

    it('should return false for non-existent session', () => {
      const deleted = sessionManager.deleteSession('non-existent');
      expect(deleted).toBe(false);
    });
  });
});
