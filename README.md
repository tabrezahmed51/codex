# Telegram Bot Emulation App

A comprehensive web application for testing and developing Telegram bots in a safe, controlled environment.

## Features

- 🤖 **Bot Session Management**: Create and manage multiple bot instances
- 💬 **Real-time Chat Interface**: Interactive chat simulation with bots
- 🔒 **Security First**: Input validation, rate limiting, and secure defaults
- 🌐 **WebSocket Support**: Real-time updates and notifications
- 📊 **Analytics Dashboard**: Track messages, users, and bot performance
- 🎨 **Modern UI**: Clean, responsive interface with dark mode support
- 🔧 **Developer Tools**: Webhook simulation, debugging, and logging

## Tech Stack

- **Backend**: Node.js + TypeScript + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + CSS3 + HTML5
- **Security**: Helmet, CORS, Rate Limiting, Input Validation
- **Development**: ESLint, Jest, TypeScript compiler
- **Deployment**: Vercel-ready with optimized configuration

## Quick Start

### Prerequisites

- Node.js 16.0+ and npm 7.0+

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd telegram-bot-emulation-app
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Production build**:
   ```bash
   npm run build
   npm start
   ```

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
LOG_FILE=logs/telegram-bot-emulator.log
```

## API Reference

### Bot Management

#### Create Bot Session
```http
POST /api/bots
Content-Type: application/json

{
  "token": "123456789:ABCDEF1234567890abcdef1234567890abcdef",
  "username": "my_test_bot",
  "webhook_url": "https://example.com/webhook" // optional
}
```

#### Get Bot Info
```http
GET /api/bots/{sessionId}
```

#### List All Bots
```http
GET /api/bots
```

#### Delete Bot
```http
DELETE /api/bots/{sessionId}
```

### Message Handling

#### Send Message to Bot
```http
POST /api/bots/{sessionId}/sendMessage
Content-Type: application/json

{
  "message_id": 1,
  "from": {
    "id": 12345,
    "is_bot": false,
    "first_name": "John",
    "username": "johndoe"
  },
  "date": 1640995200,
  "chat": {
    "id": 12345,
    "type": "private",
    "first_name": "John",
    "username": "johndoe"
  },
  "text": "/start"
}
```

#### Get Chat History
```http
GET /api/bots/{sessionId}/messages?limit=50
```

### Health Check
```http
GET /api/health
```

## Usage Examples

### Basic Bot Testing

1. **Create a bot session** with your bot token
2. **Open the chat interface** for interactive testing
3. **Send messages** including commands like `/start`, `/help`
4. **Monitor responses** and debug bot behavior

### Webhook Simulation

The emulator simulates webhook calls that would normally be sent to your bot's webhook URL:

```javascript
// Simulated webhook payload
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": { ... },
    "date": 1640995200,
    "chat": { ... },
    "text": "Hello bot!"
  }
}
```

### Default Bot Commands

- `/start` - Initialize bot interaction
- `/help` - Show available commands
- `/ping` - Test bot responsiveness
- `/echo <text>` - Echo back the message
- `/time` - Get current timestamp

## Architecture

```
src/
├── controllers/     # API route handlers
├── middleware/      # Express middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Main application entry

public/
├── css/            # Stylesheets
├── js/             # Frontend JavaScript
└── index.html      # Main UI
```

## Security Features

- **Input Validation**: Joi schemas for all inputs
- **Rate Limiting**: Configurable request limits
- **CORS Protection**: Whitelist allowed origins  
- **Helmet Security**: Security headers and CSP
- **XSS Prevention**: HTML sanitization
- **Error Handling**: Safe error responses

## Development Commands

```bash
# Development
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server

# Code Quality
npm run lint         # ESLint check
npm run test         # Run Jest tests
npm run clean        # Clean build artifacts

# Deployment
vercel deploy        # Deploy to Vercel
```

## Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

### Docker (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring and Logging

- **Winston Logger**: Structured logging with multiple transports
- **Request Logging**: HTTP request/response tracking
- **Error Tracking**: Comprehensive error capture
- **Performance Metrics**: Response time monitoring

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check this README
- **Issues**: Create GitHub issue
- **Security**: Report via email (see SECURITY.md)

---

**Built with ❤️ for the Telegram bot development community**
