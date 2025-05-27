import express, { Router } from 'express';
import { register, login, getCurrentUser, updateUser } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router: Router = express.Router();

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 受保护路由
router.get('/me', protect, getCurrentUser);
router.put('/update', protect, updateUser);

export default router; 