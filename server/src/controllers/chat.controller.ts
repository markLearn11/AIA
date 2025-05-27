import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';
import Conversation from '../models/conversation.model';
import Message from '../models/message.model';

// 获取用户列表
export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user._id;
    const { search } = req.query;

    let query = { _id: { $ne: currentUser } };

    // 如果有搜索关键词，添加到查询条件
    if (search) {
      query = {
        _id: { $ne: currentUser },
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      } as any;
    }

    const users = await User.find(query).select('username email avatar status lastSeen');

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取用户列表失败'
    });
  }
};

// 创建或获取私聊会话
export const getOrCreatePrivateConversation = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user._id;
    const { userId } = req.params;

    // 验证用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 查找现有的私聊会话
    let conversation = await Conversation.findOne({
      type: 'private',
      participants: { $all: [currentUser, userId], $size: 2 }
    });

    // 如果不存在，创建新会话
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUser, userId],
        type: 'private',
        createdBy: currentUser
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取或创建会话失败'
    });
  }
};

// 创建群聊会话
export const createGroupConversation = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user._id;
    const { name, participants, avatar } = req.body;

    // 验证参数
    if (!name || !participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供群聊名称和至少一个参与者'
      });
    }

    // 确保当前用户也是参与者
    const allParticipants = [...new Set([...participants, currentUser.toString()])];

    // 创建群聊会话
    const conversation = await Conversation.create({
      name,
      participants: allParticipants,
      type: 'group',
      avatar,
      createdBy: currentUser,
      admins: [currentUser]
    });

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '创建群聊失败'
    });
  }
};

// 获取用户的所有会话
export const getUserConversations = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user._id;

    const conversations = await Conversation.find({ participants: currentUser })
      .populate({
        path: 'participants',
        select: 'username avatar status lastSeen'
      })
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取会话列表失败'
    });
  }
};

// 获取会话消息
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user._id;
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 验证会话是否存在
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    // 验证用户是否是会话的参与者
    if (!conversation.participants.includes(new mongoose.Types.ObjectId(currentUser))) {
      return res.status(403).json({
        success: false,
        message: '您不是此会话的参与者'
      });
    }

    // 分页查询消息
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username avatar')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 获取消息总数
    const totalMessages = await Message.countDocuments({ conversation: conversationId });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalMessages,
          pages: Math.ceil(totalMessages / limitNum)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || '获取消息失败'
    });
  }
}; 