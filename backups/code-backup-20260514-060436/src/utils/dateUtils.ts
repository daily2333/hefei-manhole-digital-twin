import dayjs from 'dayjs';

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param date 日期字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
 * @param date 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 生成唯一ID
 * @param prefix 前缀
 * @returns 唯一ID字符串
 */
export const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}; 