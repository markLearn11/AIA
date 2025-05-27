// 格式化时间
export const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // 今天
  if (diffDays === 0) {
    return formatHourMinute(date);
  }
  
  // 昨天
  if (diffDays === 1) {
    return `昨天 ${formatHourMinute(date)}`;
  }
  
  // 一周内
  if (diffDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${weekdays[date.getDay()]} ${formatHourMinute(date)}`;
  }
  
  // 今年内
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  
  // 更早
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

// 格式化小时和分钟
const formatHourMinute = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 生成随机颜色
export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// 获取用户名首字母作为头像
export const getInitials = (name: string): string => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 防抖函数
export const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}; 