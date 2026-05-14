import { AlarmLevel } from '../typings';

/**
 * 日期时间格式化函数
 * @param dateStr 日期字符串或Date对象
 * @param format 格式化模式
 * @returns 格式化后的日期字符串
 */
export const formatDateTime = (
  dateStr: string | Date,
  format: 'date' | 'time' | 'datetime' | 'year-month' = 'datetime'
): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  
  if (isNaN(date.getTime())) {
    return '无效日期';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    case 'year-month':
      return `${year}年${month}月`;
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
};

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export const generateUniqueId = (): string => {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
};

/**
 * 根据值获取对应的状态颜色
 * @param value 当前值
 * @param thresholds 阈值配置 {warning, error}
 * @returns 状态颜色
 */
export const getStatusColor = (
  value: number,
  thresholds: { warning: number; error: number },
  isReversed = false
): string => {
  if (!isReversed) {
    if (value >= thresholds.error) return '#f5222d'; // 红色-错误
    if (value >= thresholds.warning) return '#faad14'; // 黄色-警告
    return '#52c41a'; // 绿色-正常
  } else {
    if (value <= thresholds.error) return '#f5222d'; // 红色-错误
    if (value <= thresholds.warning) return '#faad14'; // 黄色-警告
    return '#52c41a'; // 绿色-正常
  }
};

/**
 * 随机生成指定范围内的数字
 * @param min 最小值
 * @param max 最大值
 * @param decimal 小数位数
 * @returns 随机数
 */
export const getRandomNumber = (min: number, max: number, decimal = 0): number => {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimal));
};

/**
 * 数据单位格式化
 * @param value 数值
 * @param unit 单位
 * @param decimal 小数位数
 * @returns 格式化后的字符串
 */
export const formatWithUnit = (value: number, unit: string, decimal = 1): string => {
  return `${value.toFixed(decimal)}${unit}`;
};

/**
 * 将告警级别转换为对应的颜色
 * @param level 告警级别
 * @returns 对应的颜色代码
 */
export const getAlarmLevelColor = (level: string): string => {
  switch (level) {
    case AlarmLevel.Info:
    case 'Info':
    case 'info':
      return '#1890ff'; // 蓝色
    case AlarmLevel.Notice:
    case 'Notice':
    case 'notice':
      return '#52c41a'; // 绿色
    case AlarmLevel.Warning:
    case 'Warning':
    case 'warning':
      return '#faad14'; // 黄色
    case AlarmLevel.Alert:
    case 'Alert':
    case 'alert':
      return '#fa8c16'; // 橙色
    case AlarmLevel.Emergency:
    case 'Emergency':
    case 'emergency':
      return '#ff4d4f'; // 红色
    default:
      return '#d9d9d9'; // 灰色
  }
};

/**
 * 获取设备状态标签颜色
 * @param status 设备状态
 * @returns 对应的颜色代码
 */
export const getDeviceStatusColor = (status: string): string => {
  switch (status) {
    case 'normal':
      return '#52c41a'; // 绿色
    case 'warning':
      return '#faad14'; // 黄色
    case 'alarm':
      return '#f5222d'; // 红色
    case 'maintenance':
      return '#1890ff'; // 蓝色
    case 'offline':
      return '#d9d9d9'; // 灰色
    default:
      return '#d9d9d9'; // 灰色
  }
};

// 导出所有工具函数
export * from './mapHelpers';

// 其他工具函数
export * from './dateUtils';
export * from './alarmUtils';

// 异常检测和健康评分工具
export * from './healthScoreUtils';

// 如果还有其他工具函数导出，请在此处添加 