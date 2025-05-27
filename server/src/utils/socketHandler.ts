/*
 * @Author: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @Date: 2025-05-27 15:48:21
 * @LastEditors: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @LastEditTime: 2025-05-27 15:49:02
 * @FilePath: /AiA/server/src/utils/socketHandler.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import Message from '../models/message.model';
import Conversation from '../models/conversation.model';
import mongoose from 'mongoose';

// 定义用户类型
interface DecodedUser {
  id: string;
  email: string;
}

// 用户Socket映射
const userSocketMap: { [userId: string]: string } = {};

export const socketHandler = (io: Server, socket: Socket) => {
  console.log(`用户已连接: ${socket.id}`);

  // 处理身份验证
  socket.on('authenticate', async (token) => {
    try {
      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as DecodedUser;
      const user = await User.findById(decoded.id);

      if (!user) {
        socket.emit('auth_error', '用户不存在');
        return;
      }

      // 更新用户状态为在线
      await User.findByIdAndUpdate(decoded.id, { status: 'online', lastSeen: new Date() });

      // 将用户ID与socket ID关联
      const userId = decoded.id;
      userSocketMap[userId] = socket.id;
      socket.data.userId = userId;

      // 加入所有用户参与的会话
      const conversations = await Conversation.find({ participants: decoded.id });
      conversations.forEach(conversation => {
        // 使用 mongoose 文档的 _id 属性，它应该是 ObjectId 类型
        const conversationId = conversation._id instanceof mongoose.Types.ObjectId 
          ? conversation._id.toString() 
          : String(conversation._id);
        socket.join(conversationId);
      });

      // 通知其他用户该用户上线
      socket.broadcast.emit('user_status_change', { userId: decoded.id, status: 'online' });

      socket.emit('authenticated', { userId: decoded.id });
      console.log(`用户已认证: ${user.username}`);
    } catch (error) {
      console.error('认证错误:', error);
      socket.emit('auth_error', '认证失败');
    }
  });

  // 处理发送消息
  socket.on('send_message', async (messageData) => {
    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit('error', '未认证');
        return;
      }

      const { conversationId, text, image, video, audio, file, replyTo } = messageData;

      // 验证会话是否存在
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', '会话不存在');
        return;
      }

      // 验证用户是否是会话的参与者
      if (!conversation.participants.includes(new mongoose.Types.ObjectId(userId))) {
        socket.emit('error', '您不是此会话的参与者');
        return;
      }

      // 创建新消息
      const newMessage = new Message({
        conversation: conversationId,
        sender: userId,
        text,
        image,
        video,
        audio,
        file,
        replyTo,
        readBy: [userId]
      });

      await newMessage.save();

      // 更新会话的最后一条消息
      await Conversation.findByIdAndUpdate(conversationId, { lastMessage: newMessage._id });

      // 获取完整的消息与发送者信息
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'username avatar')
        .populate({
          path: 'replyTo',
          populate: {
            path: 'sender',
            select: 'username avatar'
          }
        });

      // 向会话中的所有用户发送消息
      io.to(conversationId).emit('new_message', populatedMessage);
    } catch (error) {
      console.error('发送消息错误:', error);
      socket.emit('error', '发送消息失败');
    }
  });

  // 处理标记消息为已读
  socket.on('mark_as_read', async ({ messageId }) => {
    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit('error', '未认证');
        return;
      }

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', '消息不存在');
        return;
      }

      // 如果用户尚未标记为已读，则添加到readBy数组
      if (!message.readBy.includes(new mongoose.Types.ObjectId(userId))) {
        message.readBy.push(new mongoose.Types.ObjectId(userId));
        await message.save();

        // 通知会话中的其他用户
        io.to(message.conversation.toString()).emit('message_read', {
          messageId,
          userId
        });
      }
    } catch (error) {
      console.error('标记已读错误:', error);
      socket.emit('error', '标记已读失败');
    }
  });

  // 处理用户正在输入
  socket.on('typing', ({ conversationId }) => {
    const userId = socket.data.userId;
    if (!userId) return;

    socket.to(conversationId).emit('user_typing', { userId, conversationId });
  });

  // 处理用户停止输入
  socket.on('stop_typing', ({ conversationId }) => {
    const userId = socket.data.userId;
    if (!userId) return;

    socket.to(conversationId).emit('user_stop_typing', { userId, conversationId });
  });

  // 处理用户断开连接
  socket.on('disconnect', async () => {
    const userId = socket.data.userId;
    if (userId) {
      // 更新用户状态为离线
      await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
      
      // 删除用户Socket映射
      delete userSocketMap[userId];

      // 通知其他用户该用户离线
      socket.broadcast.emit('user_status_change', { userId, status: 'offline' });
      
      console.log(`用户已断开连接: ${userId}`);
    }
  });
}; 