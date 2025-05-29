/*
 * @Author: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @Date: 2025-05-29 13:48:29
 * @LastEditors: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @LastEditTime: 2025-05-29 15:06:27
 * @FilePath: /AIA/src/services/aiApi.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import apiClient from './apiClient';
import { Message, ApiResponse } from './api';

// OpenAI API配置
const OPENAI_API_KEY = 'sk-fn8e2bsYoacBQhY92S96Te9tmw8jpKBZTCnymY1OTl1nwDlP'; // 请在此处填入您的OpenAI API密钥
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// AI聊天相关接口
export const aiApi = {
  // 发送消息给AI并获取回复 (内部API)
  sendMessage: (message: string) => {
    return apiClient.post<ApiResponse<Message>>('/ai/chat', { message });
  },
  
  // 获取AI聊天历史记录 (内部API)
  getChatHistory: (page = 1, limit = 20) => {
    return apiClient.get<ApiResponse<{ messages: Message[]; total: number; page: number; pages: number }>>(
      '/ai/chat/history',
      { params: { page, limit } }
    );
  },

  // 使用OpenAI ChatGPT发送消息并获取回复
  sendMessageToChatGPT: async (message: string, conversationHistory: Array<{role: string, content: string}> = []) => {
    try {
      // 如果API密钥未设置，则返回错误
      if (!OPENAI_API_KEY) {
        return {
          success: false,
          message: '未配置OpenAI API密钥',
          data: { text: '请配置OpenAI API密钥后再试。' }
        };
      }

      // 准备消息历史
      const messages = [
        { role: 'system', content: '你是一个友好的AI助手，请用中文回答用户的问题。' },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      // 调用OpenAI API
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      // 解析响应
      const data = await response.json();
      
      if (data.error) {
        return {
          success: false,
          message: data.error.message,
          data: { text: '与AI服务通信时出错，请稍后再试。' }
        };
      }

      return {
        success: true,
        data: { 
          text: data.choices[0].message.content.trim(),
          role: 'assistant'
        }
      };
    } catch (error) {
      console.error('OpenAI API调用失败:', error);
      return {
        success: false,
        message: '网络错误',
        data: { text: '无法连接到AI服务，请检查您的网络连接后再试。' }
      };
    }
  }
};

// AI联系人信息
export const AI_CONTACT = {
  _id: 'ai-assistant',
  username: 'AI助手',
  email: 'ai@assistant.com',
  avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png',
  status: 'online',
}; 