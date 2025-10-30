import { TelegramMessage, TelegramUpdate, BotCommand, ApiResponse } from '../types/telegram';
import { sessionManager } from './sessionManager';
import { sanitizeText } from '../utils/validation';
import logger from '../utils/logger';

export class TelegramBotEmulator {
  private messageIdCounter = 1;
  private updateIdCounter = 1;

  generateMessageId(): number {
    return this.messageIdCounter++;
  }

  generateUpdateId(): number {
    return this.updateIdCounter++;
  }

  async processMessage(sessionId: string, message: TelegramMessage): Promise<TelegramMessage | null> {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      logger.error(`Session not found: ${sessionId}`);
      return null;
    }

    // Add message to session
    sessionManager.addMessage(sessionId, message);

    // Process bot commands
    if (message.text?.startsWith('/')) {
      return this.processCommand(sessionId, message);
    }

    // Echo back the message for basic interaction
    const response: TelegramMessage = {
      message_id: this.generateMessageId(),
      from: {
        id: 123456789, // Bot ID
        is_bot: true,
        first_name: session.botConfig.username,
        username: session.botConfig.username,
      },
      date: Math.floor(Date.now() / 1000),
      chat: message.chat,
      text: `Echo: ${sanitizeText(message.text || '')}`,
    };

    sessionManager.addMessage(sessionId, response);
    return response;
  }

  private async processCommand(sessionId: string, message: TelegramMessage): Promise<TelegramMessage | null> {
    const session = sessionManager.getSession(sessionId);
    if (!session || !message.text) return null;

    const commandText = message.text.split(' ')[0]?.substring(1); // Remove '/' prefix
    const command = session.botConfig.commands.find(cmd => cmd.command === commandText);

    if (!command) {
      return this.createErrorResponse(message, `Unknown command: /${commandText}`);
    }

    try {
      const result = await command.handler(message);
      
      if (typeof result === 'string') {
        return this.createBotResponse(message, result);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error processing command /${commandText}:`, error);
      return this.createErrorResponse(message, 'An error occurred processing your command.');
    }
  }

  private createBotResponse(originalMessage: TelegramMessage, text: string): TelegramMessage {
    return {
      message_id: this.generateMessageId(),
      from: {
        id: 123456789, // Bot ID
        is_bot: true,
        first_name: 'Bot',
        username: 'test_bot',
      },
      date: Math.floor(Date.now() / 1000),
      chat: originalMessage.chat,
      text: sanitizeText(text),
    };
  }

  private createErrorResponse(originalMessage: TelegramMessage, error: string): TelegramMessage {
    return this.createBotResponse(originalMessage, `❌ Error: ${error}`);
  }

  createUpdate(message: TelegramMessage): TelegramUpdate {
    return {
      update_id: this.generateUpdateId(),
      message,
    };
  }

  // Simulate sending message to external webhook
  async simulateWebhook(sessionId: string, update: TelegramUpdate): Promise<boolean> {
    const session = sessionManager.getSession(sessionId);
    if (!session?.botConfig.webhook_url) {
      logger.warn(`No webhook URL configured for session: ${sessionId}`);
      return false;
    }

    try {
      // In a real implementation, this would make an HTTP POST request
      // For emulation, we just log it
      logger.info(`Webhook simulation for ${session.botConfig.webhook_url}:`, {
        sessionId,
        update,
      });
      
      return true;
    } catch (error) {
      logger.error(`Webhook simulation failed for session ${sessionId}:`, error);
      return false;
    }
  }

  // Simulate Telegram Bot API responses
  sendMessage(sessionId: string, chatId: number, text: string): ApiResponse<TelegramMessage> {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return {
        ok: false,
        error_code: 404,
        description: 'Session not found',
      };
    }

    const chat = session.chats.get(chatId);
    if (!chat) {
      return {
        ok: false,
        error_code: 400,
        description: 'Bad Request: chat not found',
      };
    }

    const message: TelegramMessage = {
      message_id: this.generateMessageId(),
      from: {
        id: 123456789,
        is_bot: true,
        first_name: session.botConfig.username,
        username: session.botConfig.username,
      },
      date: Math.floor(Date.now() / 1000),
      chat,
      text: sanitizeText(text),
    };

    sessionManager.addMessage(sessionId, message);

    return {
      ok: true,
      result: message,
    };
  }
}

export const botEmulator = new TelegramBotEmulator();
