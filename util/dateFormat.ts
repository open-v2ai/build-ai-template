/**
 * 格式化日期时间，精确到秒
 * @param dateString ISO日期字符串
 * @returns 格式化的日期时间字符串 (例如: 2025/08/22 14:42:22)
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * 格式化日期，只显示日期部分
 * @param dateString ISO日期字符串
 * @returns 格式化的日期字符串 (例如: 2025/08/22)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};
