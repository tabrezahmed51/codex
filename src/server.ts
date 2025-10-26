import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { config } from './utils/config';
import logger from './utils/logger';
import { rateLimitMiddleware, errorHandler, requestLogger, validateContentType } from './middleware';
import { sessionManager } from './services/sessionManager';
import apiRoutes from './routes/api';
import { SocketMessage } from './types/app';

// Load environment variables
dotenv.config();

class TelegramBotEmulatorServer {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.allowedOrigins,
        methods: ['GET', 'POST'],
      },
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
    this.startCleanupInterval();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
    }));

    // Rate limiting
    this.app.use(rateLimitMiddleware);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Custom middleware
    this.app.use(requestLogger);
    this.app.use(validateContentType);

    // Static files
    this.app.use(express.static('public'));
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', apiRoutes);

    // Serve frontend
    this.app.get('/', (req, res) => {
      res.sendFile('index.html', { root: 'public' });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      socket.on('join-session', (sessionId: string) => {
        const session = sessionManager.getSession(sessionId);
        if (session) {
          socket.join(sessionId);
          logger.info(`Socket ${socket.id} joined session: ${sessionId}`);
          
          socket.emit('session-joined', {
            sessionId,
            botUsername: session.botConfig.username,
          });
        } else {
          socket.emit('error', { message: 'Session not found' });
        }
      });

      socket.on('leave-session', (sessionId: string) => {
        socket.leave(sessionId);
        logger.info(`Socket ${socket.id} left session: ${sessionId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });
  }

  private startCleanupInterval(): void {
    // Clean up old sessions every hour
    setInterval(() => {
      sessionManager.cleanupOldSessions();
    }, 60 * 60 * 1000);
  }

  public broadcastToSession(sessionId: string, message: SocketMessage): void {
    this.io.to(sessionId).emit('message', message);
  }

  public start(): void {
    this.server.listen(config.port, () => {
      logger.info(`Telegram Bot Emulator Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`CORS Origins: ${config.cors.allowedOrigins.join(', ')}`);
    });
  }

  public stop(): void {
    this.server.close(() => {
      logger.info('Server stopped');
    });
  }
}

// Create and start server
const server = new TelegramBotEmulatorServer();

if (require.main === module) {
  server.start();
}

export default server;
