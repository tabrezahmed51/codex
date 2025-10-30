import Joi from 'joi';
import { TelegramMessage, TelegramUser, BotConfig } from '../types/telegram';

export const telegramUserSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  is_bot: Joi.boolean().required(),
  first_name: Joi.string().min(1).max(64).required(),
  last_name: Joi.string().max(64).optional(),
  username: Joi.string().alphanum().min(5).max(32).optional(),
  language_code: Joi.string().length(2).optional(),
});

export const telegramChatSchema = Joi.object({
  id: Joi.number().integer().required(),
  type: Joi.string().valid('private', 'group', 'supergroup', 'channel').required(),
  title: Joi.string().max(255).optional(),
  username: Joi.string().alphanum().min(5).max(32).optional(),
  first_name: Joi.string().max(64).optional(),
  last_name: Joi.string().max(64).optional(),
});

export const telegramMessageSchema = Joi.object({
  message_id: Joi.number().integer().positive().required(),
  from: telegramUserSchema.optional(),
  date: Joi.number().integer().positive().required(),
  chat: telegramChatSchema.required(),
  text: Joi.string().max(4096).optional(),
  entities: Joi.array().items(Joi.object()).optional(),
  reply_to_message: Joi.object().optional(),
});

export const botConfigSchema = Joi.object({
  token: Joi.string().pattern(/^\d+:[A-Za-z0-9_-]{35,}$/).required(),
  username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(5).max(32).required(),
  webhook_url: Joi.string().uri().optional(),
  allowed_updates: Joi.array().items(Joi.string()).optional(),
});

export const validateTelegramMessage = (message: any): { error?: any; value?: TelegramMessage } => {
  return telegramMessageSchema.validate(message);
};

export const validateTelegramUser = (user: any): { error?: any; value?: TelegramUser } => {
  return telegramUserSchema.validate(user);
};

export const validateBotConfig = (config: any): { error?: any; value?: BotConfig } => {
  return botConfigSchema.validate(config);
};

export const sanitizeText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
    .substring(0, 4096); // Telegram message limit
};
