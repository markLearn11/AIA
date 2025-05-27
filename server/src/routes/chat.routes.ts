import express, { Router } from 'express';
import {
  getUsers,
  getOrCreatePrivateConversation,
  createGroupConversation,
  getUserConversations,
  getConversationMessages
} from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';

const router: Router = express.Router();

// 所有路由都需要身份验证
router.use(protect as express.RequestHandler);

// 用户相关路由
router.get('/users', getUsers as express.RequestHandler);

// 会话相关路由
router.get('/conversations', getUserConversations as express.RequestHandler);
router.get('/conversations/:conversationId/messages', getConversationMessages as express.RequestHandler);
router.post('/conversations/private/:userId', getOrCreatePrivateConversation as express.RequestHandler);
router.post('/conversations/group', createGroupConversation as express.RequestHandler);

export default router; 