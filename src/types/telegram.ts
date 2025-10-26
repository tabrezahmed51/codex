// Core types for Telegram Bot Emulation
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string;
  entities?: MessageEntity[];
  reply_to_message?: TelegramMessage;
}

export interface MessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  inline_query?: any;
  chosen_inline_result?: any;
  callback_query?: any;
}

export interface BotCommand {
  command: string;
  description: string;
  handler: (message: TelegramMessage) => Promise<TelegramMessage | string>;
}

export interface BotConfig {
  token: string;
  username: string;
  webhook_url?: string;
  allowed_updates?: string[];
  commands: BotCommand[];
}

export interface EmulatorSession {
  id: string;
  botConfig: BotConfig;
  users: Map<number, TelegramUser>;
  chats: Map<number, TelegramChat>;
  messages: TelegramMessage[];
  createdAt: Date;
  lastActivity: Date;
}

export interface WebhookPayload {
  url: string;
  method: 'POST';
  headers: Record<string, string>;
  body: TelegramUpdate;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}
