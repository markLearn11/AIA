import apiClient from './apiClient';

// 定义接口响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

// 用户相关类型
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  token?: string;
  status?: string;
  lastSeen?: string;
}

// 消息类型
export interface Message {
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

// 会话类型
export interface Conversation {
  _id: string;
  name?: string;
  type: 'private' | 'group';
  participants: any[];
  lastMessage?: {
    text?: string;
    image?: string;
    video?: string;
    audio?: string;
    sender: {
      _id: string;
      username: string;
    };
    createdAt: string;
  };
  avatar?: string;
  updatedAt: string;
}

// 认证API
export const authApi = {
  // 登录
  login: (email: string, password: string) => {
    return apiClient.post<User>('/auth/login', { email, password });
  },

  // 注册
  register: (username: string, email: string, password: string) => {
    return apiClient.post<User>('/auth/register', { username, email, password });
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return apiClient.get<User>('/auth/me');
  },

  // 更新用户信息
  updateUser: (data: { username?: string; avatar?: string }) => {
    return apiClient.put<User>('/auth/update', data);
  }
};

// 会话API
export const chatApi = {
  // 获取会话列表
  getConversations: () => {
    return apiClient.get<Conversation[]>('/chat/conversations');
  },

  // 获取单个会话
  getConversation: (id: string) => {
    return apiClient.get<Conversation>(`/chat/conversations/${id}`);
  },

  // 创建会话
  createConversation: (data: { participants: string[]; type: 'private' | 'group'; name?: string }) => {
    return apiClient.post<Conversation>('/chat/conversations', data);
  },

  // 获取会话消息
  getMessages: (conversationId: string, page = 1, limit = 20) => {
    return apiClient.get<{ messages: Message[]; total: number; page: number; pages: number }>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
  },

  // 发送消息
  sendMessage: (conversationId: string, data: { text?: string; image?: string; video?: string; audio?: string }) => {
    return apiClient.post<Message>(`/chat/conversations/${conversationId}/messages`, data);
  },

  // 标记消息为已读
  markAsRead: (messageId: string) => {
    return apiClient.put<Message>(`/chat/messages/${messageId}/read`);
  }
};

// 联系人API
export const contactsApi = {
  // 获取联系人列表
  getContacts: () => {
    return apiClient.get<User[]>('/chat/users');
  },

  // 搜索用户
  searchUsers: (query: string) => {
    return apiClient.get<User[]>('/chat/users/search', {
      params: { query }
    });
  }
}; 