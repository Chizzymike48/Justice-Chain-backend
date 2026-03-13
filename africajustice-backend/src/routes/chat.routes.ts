import express, { type Request, type Response } from 'express';
import { authenticate as authenticateToken } from '../middleware/auth';
import type { AuthRequest } from '../types';
import chatService from '../services/chatService';

const router = express.Router();

const requireUserId = (req: AuthRequest, res: Response): string | null => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: missing user context' });
    return null;
  }
  return userId;
};

// POST: Send a message
router.post('/send', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { message, messageType = 'text', voiceUrl, language = 'en' } = req.body;
    const userId = requireUserId(req, res);
    if (!userId) return;

    // Save user message
    const userMessage = await chatService.saveMessage(userId, 'user', message, messageType, voiceUrl);

    // Generate bot response (use keyword-based, no AI for speed)
    const botResponse = await chatService.generateBotResponse(message, userId, language, false);

    // Save bot response
    const savedBotResponse = await chatService.saveMessage(userId, 'bot', botResponse, 'text');

    res.json({
      success: true,
      userMessage,
      botResponse: savedBotResponse,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET: Conversation history
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await chatService.getConversationHistory(userId, limit);

    res.json({
      success: true,
      messages: history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET: Search chat history
router.get('/search', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = await chatService.searchChatHistory(userId, query);

    res.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// POST: Rate a message
router.post('/:messageId/rate', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { rating } = req.body;
    const { messageId } = req.params;
    const userId = requireUserId(req, res);
    if (!userId) return;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const rated = await chatService.rateChatResponse(messageId, rating);

    res.json({
      success: true,
      message: rated,
    });
  } catch (error) {
    console.error('Error rating message:', error);
    res.status(500).json({ error: 'Failed to rate message' });
  }
});

// GET: Conversation statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const stats = await chatService.getConversationStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// DELETE: Clear chat history
router.delete('/history/clear', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { daysOld = 30 } = req.body;

    const result = await chatService.deleteOldMessages(userId, daysOld);

    res.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// GET: Case-related chat
router.get('/case/:caseId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { caseId } = req.params;

    const messages = await chatService.getCaseRelatedMessages(caseId);

    res.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error fetching case messages:', error);
    res.status(500).json({ error: 'Failed to fetch case messages' });
  }
});

// TEST ENDPOINT: Send a chat message without authentication (for development/testing only)
router.post('/test/send', async (req: Request, res: Response): Promise<any> => {
  try {
    const { message, language = 'en' } = req.body;
    const testUserId = 'test-user-' + Date.now();

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate bot response with timeout protection
    let botResponse: string;
    try {
      const responsePromise = chatService.generateBotResponse(message, testUserId, language, false);
      const timeoutPromise = new Promise<string>((resolve) => 
        setTimeout(() => resolve("I'm here to help! How can I assist you today?"), 5000)
      );
      
      botResponse = await Promise.race([responsePromise, timeoutPromise]);
    } catch (genError) {
      console.error('Error generating bot response:', genError);
      botResponse = "I'm here to help! How can I assist you today?";
    }

    res.json({
      success: true,
      userMessage: message,
      botResponse: botResponse,
      language: language,
    });
  } catch (error) {
    console.error('Error in test chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
