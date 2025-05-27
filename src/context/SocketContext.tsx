import React, { createContext, useContext, useEffect, useState } from 'react';
// 注意：需要安装 socket.io-client 包
// npm install socket.io-client @types/socket.io-client
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// 定义消息和数据类型
interface AuthData {
  userId: string;
}

interface ErrorData {
  message: string;
}

interface Message {
  _id: string;
  text?: string;
  image?: string;
  video?: string;
  audio?: string;
  conversation: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

// Socket上下文类型
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: Message | null;
  sendMessage: (messageData: any) => void;
  markAsRead: (messageId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

// 创建上下文
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Socket服务器URL
// const SOCKET_URL = 'http://10.0.2.2:8888'; // Android模拟器
const SOCKET_URL = 'http://localhost:8888'; // iOS模拟器

// 提供者组件
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  // 连接和断开Socket
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // 创建Socket连接
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    // 设置Socket
    setSocket(newSocket);

    // 连接事件处理
    newSocket.on('connect', () => {
      console.log('Socket已连接');
      setIsConnected(true);

      // 发送身份验证
      newSocket.emit('authenticate', user.token);
    });

    // 身份验证成功
    newSocket.on('authenticated', (data: AuthData) => {
      console.log('Socket已认证:', data);
    });

    // 身份验证错误
    newSocket.on('auth_error', (error: ErrorData) => {
      console.error('Socket认证错误:', error);
    });

    // 新消息
    newSocket.on('new_message', (message: Message) => {
      setLastMessage(message);
    });

    // 断开连接
    newSocket.on('disconnect', () => {
      console.log('Socket已断开');
      setIsConnected(false);
    });

    // 错误处理
    newSocket.on('error', (error: ErrorData) => {
      console.error('Socket错误:', error);
    });

    // 清理函数
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  // 发送消息
  const sendMessage = (messageData: any) => {
    if (socket && isConnected) {
      socket.emit('send_message', messageData);
    }
  };

  // 标记消息为已读
  const markAsRead = (messageId: string) => {
    if (socket && isConnected) {
      socket.emit('mark_as_read', { messageId });
    }
  };

  // 开始输入
  const startTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversationId });
    }
  };

  // 停止输入
  const stopTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('stop_typing', { conversationId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastMessage,
        sendMessage,
        markAsRead,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// 自定义钩子，方便使用上下文
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket必须在SocketProvider内部使用');
  }
  return context;
}; 