import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { ApiResponse } from '../services/apiClient';

// 定义请求状态类型
interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// 定义请求钩子返回类型
interface UseRequestReturn<T, P extends any[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: P) => Promise<T | null>;
  reset: () => void;
}

/**
 * 自定义请求钩子
 * @param requestFn 请求函数
 * @param initialData 初始数据
 * @param showErrorAlert 是否显示错误提示
 * @returns 请求状态和执行函数
 */
export function useRequest<T, P extends any[]>(
  requestFn: (...args: P) => Promise<ApiResponse<T>>,
  initialData: T | null = null,
  showErrorAlert = true
): UseRequestReturn<T, P> {
  // 请求状态
  const [state, setState] = useState<RequestState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  // 执行请求
  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const response = await requestFn(...args);
        
        if (response.success) {
          setState({ data: response.data, loading: false, error: null });
          return response.data;
        } else {
          throw new Error(response.message || '请求失败');
        }
      } catch (error: any) {
        console.error('请求错误:', error);
        setState({ data: null, loading: false, error });
        
        // 显示错误提示
        if (showErrorAlert) {
          Alert.alert(
            '请求错误',
            error.message || '发生未知错误，请稍后重试'
          );
        }
        
        return null;
      }
    },
    [requestFn, showErrorAlert]
  );

  // 重置状态
  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * 自定义查询钩子（自动执行）
 * @param requestFn 请求函数
 * @param deps 依赖数组
 * @param args 请求参数
 * @param initialData 初始数据
 * @param showErrorAlert 是否显示错误提示
 * @returns 请求状态和刷新函数
 */
export function useQuery<T, P extends any[]>(
  requestFn: (...args: P) => Promise<ApiResponse<T>>,
  deps: React.DependencyList = [],
  args: P,
  initialData: T | null = null,
  showErrorAlert = true
) {
  const { data, loading, error, execute } = useRequest<T, P>(
    requestFn,
    initialData,
    showErrorAlert
  );

  // 刷新数据
  const refresh = useCallback(() => {
    return execute(...args);
  }, [execute, ...args]);

  // 当依赖变化时执行请求
  useEffect(() => {
    refresh();
  }, [...deps, refresh]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

/**
 * 自定义突变钩子（手动执行）
 * @param requestFn 请求函数
 * @param onSuccess 成功回调
 * @param showErrorAlert 是否显示错误提示
 * @returns 请求状态和执行函数
 */
export function useMutation<T, P extends any[]>(
  requestFn: (...args: P) => Promise<ApiResponse<T>>,
  onSuccess?: (data: T) => void,
  showErrorAlert = true
) {
  const { data, loading, error, execute } = useRequest<T, P>(
    requestFn,
    null,
    showErrorAlert
  );

  // 执行突变
  const mutate = useCallback(
    async (...args: P) => {
      const result = await execute(...args);
      if (result && onSuccess) {
        onSuccess(result);
      }
      return result;
    },
    [execute, onSuccess]
  );

  return {
    data,
    loading,
    error,
    mutate,
  };
} 