import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API基础URL - 根据平台选择正确的URL
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8888/api'  // Android模拟器
  : 'http://127.0.0.1:8888/api'; // iOS设备或模拟器

// 请求方法类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 请求配置类型
interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  cache?: boolean;
}

// 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * 发送API请求
 * @param method HTTP方法
 * @param endpoint API端点
 * @param data 请求数据
 * @param config 请求配置
 * @returns Promise<ApiResponse<T>>
 */
async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  data?: any,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  try {
    // 构建URL
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // 添加查询参数
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    // 准备请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    
    // 添加授权头
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user?.token) {
          headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
    
    // 准备请求选项
    const requestOptions: RequestInit = {
      method,
      headers,
      body: data && method !== 'GET' ? JSON.stringify(data) : undefined,
    };
    
    // 创建AbortController用于超时处理
    const controller = new AbortController();
    requestOptions.signal = controller.signal;
    
    // 设置超时
    const timeoutId = config.timeout 
      ? setTimeout(() => controller.abort(), config.timeout) 
      : null;
    
    // 发送请求
    const response = await fetch(url.toString(), requestOptions);
    
    // 清除超时
    if (timeoutId) clearTimeout(timeoutId);
    
    // 解析响应
    const responseData = await response.json();
    
    // 检查响应状态
    if (!response.ok) {
      return Promise.reject({
        status: response.status,
        message: responseData.message || '请求失败',
        data: responseData
      });
    }
    
    return responseData as ApiResponse<T>;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return Promise.reject({ message: '请求超时' });
    }
    return Promise.reject(error);
  }
}

// API客户端
const apiClient = {
  get<T = any>(endpoint: string, config?: RequestConfig) {
    return request<T>('GET', endpoint, undefined, config);
  },
  
  post<T = any>(endpoint: string, data?: any, config?: RequestConfig) {
    return request<T>('POST', endpoint, data, config);
  },
  
  put<T = any>(endpoint: string, data?: any, config?: RequestConfig) {
    return request<T>('PUT', endpoint, data, config);
  },
  
  delete<T = any>(endpoint: string, config?: RequestConfig) {
    return request<T>('DELETE', endpoint, undefined, config);
  }
};

export default apiClient; 