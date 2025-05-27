import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

// 扩展Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    // 从请求头中获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 检查token是否存在
    if (!token) {
      res.status(401).json({
        success: false,
        message: '未授权，请登录'
      });
      return;
    }

    try {
      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;

      // 获取用户信息
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      // 将用户信息添加到请求对象
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: '无效的令牌，请重新登录'
      });
      return;
    }
  } catch (error) {
    next(error);
  }
}; 