import { AlarmType, AlarmLevel } from '../typings';

/**
 * 获取告警类型的描述文本
 * @param type 告警类型
 * @param value 告警相关的数值
 * @returns 告警描述文本
 */
export const getAlarmDescription = (type: AlarmType, value: number | string): string => {
  // 确保value是字符串
  const valueStr = typeof value === 'number' ? value.toString() : value;
  
  switch (type) {
    case AlarmType.WaterLevel:
      return `水位异常 (${valueStr}mm)`;
    case AlarmType.GasLevel:
      return `气体浓度异常 (${valueStr}ppm)`;
    case AlarmType.Temperature:
      return `温度异常 (${valueStr}°C)`;
    case AlarmType.BatteryLow:
      return `电池电量低 (${valueStr}%)`;
    case AlarmType.CoverOpen:
      return '井盖开启';
    case AlarmType.SignalLoss:
      return '信号丢失';
    case AlarmType.Vibration:
      return `振动异常 (${valueStr})`;
    case AlarmType.Tilt:
      return `倾斜异常 (${valueStr}°)`;
    case AlarmType.Custom:
      return '自定义告警';
    default:
      return '未知告警类型';
  }
};

/**
 * 获取告警级别的描述文本
 * @param level 告警级别
 * @returns 
 */
export const getAlarmLevelDescription = (level: AlarmLevel): string => {
  switch (level) {
    case AlarmLevel.Info:
      return '信息';
    case AlarmLevel.Notice:
      return '提醒';
    case AlarmLevel.Warning:
      return '警告';
    case AlarmLevel.Alert:
      return '严重';
    case AlarmLevel.Emergency:
      return '紧急';
    default:
      return '未知级别';
  }
};

/**
 * 获取告警级别对应的颜色
 * @param level 告警级别
 * @returns 颜色代码
 */
export const getAlarmLevelColor = (level: AlarmLevel): string => {
  switch (level) {
    case AlarmLevel.Info:
      return '#1890ff'; // 蓝色
    case AlarmLevel.Notice:
      return '#52c41a'; // 绿色
    case AlarmLevel.Warning:
      return '#faad14'; // 黄色
    case AlarmLevel.Alert:
      return '#fa8c16'; // 橙色
    case AlarmLevel.Emergency:
      return '#f5222d'; // 红色
    default:
      return '#8c8c8c'; // 灰色
  }
};

/**
 * 使用Z-score算法进行异常检测
 * @param value 当前值
 * @param data 历史数据数组
 * @param threshold Z-score阈值，通常为2~3
 * @returns 异常检测结果
 */
export const detectAnomaly = (value: number, data: number[], threshold: number = 3): {
  isAnomaly: boolean;
  zScore: number;
  normalRange: [number, number];
} => {
  // 至少需要有5个数据点才能进行异常检测
  if (data.length < 5) {
    return {
      isAnomaly: false,
      zScore: 0,
      normalRange: [value - 1, value + 1]
    };
  }

  // 计算平均值
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  // 计算标准差
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  // 计算Z-score
  const zScore = Math.abs((value - mean) / (stdDev || 1)); // 避免除以0
  
  // 确定正常范围
  const normalRange: [number, number] = [
    mean - threshold * stdDev,
    mean + threshold * stdDev
  ];
  
  return {
    isAnomaly: zScore > threshold,
    zScore,
    normalRange
  };
};

/**
 * 根据数据确定告警级别
 * @param zScore Z-score值
 * @param criticalThreshold 临界值阈值
 * @returns 告警级别
 */
export const determineAlarmLevel = (zScore: number, criticalThreshold: number = 5): AlarmLevel => {
  if (zScore < 2) {
    return AlarmLevel.Info;
  } else if (zScore < 3) {
    return AlarmLevel.Notice;
  } else if (zScore < 4) {
    return AlarmLevel.Warning;
  } else if (zScore < criticalThreshold) {
    return AlarmLevel.Alert;
  } else {
    return AlarmLevel.Emergency;
  }
}; 