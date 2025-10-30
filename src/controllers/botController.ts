import { Request, Response } from 'express';
import { sessionManager } from '../services/sessionManager';
import { botEmulator } from '../services/botEmulator';
import { validateBotConfig, validateTelegramMessage } from '../utils/validation';
import { BotCommand } from '../types/telegram';
import logger from '../utils/logger';

// Default bot commands
const defaultCommands: BotCommand[] = [
  {
    command: 'start',
    description: 'Start the bot',
    handler: async () => 'Hello! Welcome to the Telegram Bot Emulator.',
  },
  {
    command: 'help',
    description: 'Show available commands',
    handler: async () => {
      return `Available commands:
/start - Start the bot
/help - Show this help message
/ping - Check if bot is responding
/echo <text> - Echo back your message
/time - Get current time`;
    },
  },
  {
    command: 'ping',
    description: 'Check bot status',
    handler: async () => 'Pong! 🏓',
  },
  {
    command: 'echo',
    description: 'Echo back your message',
    handler: async (message) => {
      const text = message.text?.substring(6).trim() || '';
      return text ? `You said: ${text}` : 'Please provide text to echo.';
    },
  },
  {
    command: 'time',
    description: 'Get current time',
    handler: async () => `Current time: ${new Date().toISOString()}`,
  },
];

export class BotController {
  // Create a new bot session
  createBot = async (req: Request, res: Response) => {
    try {
      const { error, value } = validateBotConfig(req.body);
      
      if (error) {
        return res.status(400).json({
          error: 'Invalid bot configuration',
          details: error.details.map((detail: any) => detail.message),
        });
      }

      if (!value) {
        return res.status(400).json({ error: 'Invalid configuration data' });
      }

      const botConfig = {
        token: value.token,
        username: value.username,
        webhook_url: value.webhook_url || undefined,
        allowed_updates: value.allowed_updates || undefined,
        commands: defaultCommands,
      };

      const sessionId = sessionManager.createSession(botConfig);

      logger.info(`Created bot session: ${sessionId} for ${botConfig.username}`);

      res.status(201).json({
        sessionId,
        botConfig: {
          username: botConfig.username,
          webhook_url: botConfig.webhook_url,
          commands: botConfig.commands.map(cmd => ({
            command: cmd.command,
            description: cmd.description,
          })),
        },
      });
    } catch (error) {
      logger.error('Error creating bot:', error);
      res.status(500).json({ error: 'Failed to create bot session' });
    }
  };

  // Get bot session info
  getBotInfo = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Bot session not found' });
      }

      res.json({
        sessionId,
        botConfig: {
          username: session.botConfig.username,
          webhook_url: session.botConfig.webhook_url,
          commands: session.botConfig.commands.map(cmd => ({
            command: cmd.command,
            description: cmd.description,
          })),
        },
        stats: {
          messagesCount: session.messages.length,
          usersCount: session.users.size,
          chatsCount: session.chats.size,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
        },
      });
    } catch (error) {
      logger.error('Error getting bot info:', error);
      return res.status(500).json({ error: 'Failed to get bot information' });
    }
  };

  // Send message to bot
  sendMessage = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const { error, value } = validateTelegramMessage(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid message format',
          details: error.details.map((detail: any) => detail.message),
        });
      }

      if (!value) {
        return res.status(400).json({ error: 'Invalid message data' });
      }

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Bot session not found' });
      }

      // Add user and chat to session if not exists
      if (value.from) {
        sessionManager.addUser(sessionId, value.from);
      }
      sessionManager.addChat(sessionId, value.chat);

      // Process message through bot emulator
      const response = await botEmulator.processMessage(sessionId, value);

      if (!response) {
        return res.status(500).json({ error: 'Failed to process message' });
      }

      // Create update for webhook simulation
      const update = botEmulator.createUpdate(response);
      await botEmulator.simulateWebhook(sessionId, update);

      res.json({
        ok: true,
        result: response,
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  };

  // Get chat history
  getChatHistory = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Bot session not found' });
      }

      const messages = sessionManager.getMessages(sessionId, Math.min(limit, 100));

      res.json({
        messages,
        total: session.messages.length,
      });
    } catch (error) {
      logger.error('Error getting chat history:', error);
      return res.status(500).json({ error: 'Failed to get chat history' });
    }
  };

  // Delete bot session
  deleteBot = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const deleted = sessionManager.deleteSession(sessionId);
      if (!deleted) {
        return res.status(404).json({ error: 'Bot session not found' });
      }

      res.json({ message: 'Bot session deleted successfully' });
    } catch (error) {
      logger.error('Error deleting bot:', error);
      return res.status(500).json({ error: 'Failed to delete bot session' });
    }
  };

  // List all active bot sessions
  listBots = async (req: Request, res: Response) => {
    try {
      const sessions = sessionManager.listSessions();
      
      const botList = sessions.map(session => ({
        sessionId: session.id,
        username: session.botConfig.username,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        stats: {
          messagesCount: session.messages.length,
          usersCount: session.users.size,
          chatsCount: session.chats.size,
        },
      }));

      res.json({ bots: botList });
    } catch (error) {
      logger.error('Error listing bots:', error);
      return res.status(500).json({ error: 'Failed to list bots' });
    }
  };
}

export const botController = new BotController();
