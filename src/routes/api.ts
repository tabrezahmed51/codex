import express from 'express';
import { botController } from '../controllers/botController';

const router = express.Router();

// Bot management routes
router.post('/bots', botController.createBot);
router.get('/bots', botController.listBots);
router.get('/bots/:sessionId', botController.getBotInfo);
router.delete('/bots/:sessionId', botController.deleteBot);

// Message handling routes
router.post('/bots/:sessionId/sendMessage', botController.sendMessage);
router.get('/bots/:sessionId/messages', botController.getChatHistory);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
