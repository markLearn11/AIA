import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateToken } from '../utils/generateToken';

// 注册新用户
export const register = async (req: Request, res: Response) => {
  try {
    console.log('收到注册请求:', { ...req.body, password: '******' });
    console.log('请求头:', req.headers);
    
    const { username, email, password } = req.body;

    // 检查请求体是否包含所有必需字段
    if (!username || !email || !password) {
      console.log('注册失败: 缺少必需字段');
      console.log('请求体:', req.body);
      res.status(400).json({
        success: false,
        message: '请提供用户名、邮箱和密码'
      });
      return;
    }

    // 检查用户是否已存在
    console.log('检查用户是否已存在...');
    try {
      const userExists = await User.findOne({ $or: [{ email }, { username }] });
      if (userExists) {
        console.log('注册失败: 用户已存在', { 
          existingEmail: userExists.email === email, 
          existingUsername: userExists.username === username 
        });
        res.status(400).json({
          success: false,
          message: '用户名或邮箱已被使用'
        });
        return;
      }
    } catch (findError) {
      console.error('查找用户时出错:', findError);
      console.error('错误详情:', findError instanceof Error ? findError.stack : '未知错误');
      res.status(500).json({
        success: false,
        message: '查询数据库失败'
      });
      return;
    }

    // 创建新用户
    console.log('创建新用户...');
    let user;
    try {
      user = await User.create({
        username,
        email,
        password
      });
      console.log('用户创建成功:', user._id);
    } catch (createError: any) {
      console.error('创建用户时出错:', createError);
      console.error('错误详情:', createError.stack);
      console.error('MongoDB错误代码:', createError.code);
      console.error('MongoDB错误消息:', createError.message);
      
      // 检查是否是MongoDB的唯一索引错误
      if (createError.code === 11000) {
        res.status(400).json({
          success: false,
          message: '用户名或邮箱已被使用 (唯一性约束冲突)'
        });
      } else {
        res.status(500).json({
          success: false,
          message: createError.message || '创建用户失败'
        });
      }
      return;
    }

    // 生成令牌
    console.log('生成令牌...');
    const token = generateToken(user);

    console.log('注册成功，返回用户数据');
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token
      }
    });
  } catch (error: any) {
    console.error('注册过程中发生错误:', error);
    console.error('错误详情:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || '注册失败'
    });
  }
};

// 用户登录
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码不正确'
      });
      return;
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码不正确'
      });
      return;
    }

    // 生成令牌
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取用户信息失败'
    });
  }
};

// 更新用户信息
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { username, avatar } = req.body;
    const userId = req.user._id;

    // 检查用户名是否已被使用
    if (username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
      if (usernameExists) {
        res.status(400).json({
          success: false,
          message: '用户名已被使用'
        });
        return;
      }
    }

    // 更新用户信息
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '更新用户信息失败'
    });
  }
}; 