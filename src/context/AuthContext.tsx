import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { authApi, User as ApiUser } from '../services/api';

// 定义用户类型
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  token: string;
}

// 定义上下文类型
interface AuthContextType {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserInfo: (data: Partial<ApiUser>) => void;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 提供者组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 在应用启动时检查存储的用户信息
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('加载用户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // 登录函数
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('尝试登录...');
      setLoading(true);
      
      const response = await authApi.login(email, password);
      
      if (!response.success) {
        Alert.alert('登录失败', response.message || '请检查您的凭据');
        return false;
      }

      // 保存用户信息
      const userData = response.data;
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error: any) {
      console.error('登录错误:', error);
      Alert.alert('登录失败', error.message || '网络错误，请稍后再试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 注册函数
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('开始注册流程...');
      setLoading(true);
      
      const response = await authApi.register(username, email, password);
      
      if (!response.success) {
        Alert.alert('注册失败', response.message || '请检查您的输入');
        return false;
      }

      // 保存用户信息
      const userData = response.data;
      console.log('注册成功，用户数据:', { ...userData, token: '******' });
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error: any) {
      console.error('注册过程中发生异常:', error);
      Alert.alert('注册失败', error.message || '网络错误，请稍后再试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  // 更新用户信息
  const updateUserInfo = async (data: Partial<ApiUser>) => {
    if (user) {
      try {
        const response = await authApi.updateUser(data);
        
        if (response.success) {
          const updatedUser = { ...user, ...response.data };
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('更新用户信息失败:', error);
        Alert.alert('更新失败', '无法更新用户信息，请稍后再试');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，方便使用上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
}; 