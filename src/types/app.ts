export interface AppConfig {
  port: number;
  nodeEnv: string;
  cors: {
    allowedOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface SocketMessage {
  type: 'message' | 'update' | 'error' | 'status';
  payload: any;
  timestamp: number;
}
