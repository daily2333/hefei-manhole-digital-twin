import { ManholeRealTimeData, HealthScore, HealthScoreRecord, CoverStatus } from '../typings';

/**
 * 计算加权健康评分
 * 公式: HealthScore = 0.4 * SENSOR + 0.3 * BATT + 0.3 * COMM
 * 
 * @param realTimeData 实时数据
 * @param history 历史健康评分记录
 * @returns 健康评分对象
 */
export const calculateHealthScore = (
  realTimeData: ManholeRealTimeData,
  history: HealthScoreRecord[] = []
): HealthScore => {
  // 计算传感器状态得分 (温度、水位、气体浓度等综合评估)
  const sensorScore = calculateSensorScore(realTimeData);
  
  // 计算电池状态得分
  const batteryScore = calculateBatteryScore(realTimeData.batteryLevel);
  
  // 计算通信状态得分
  const communicationScore = calculateCommunicationScore(realTimeData.signalStrength);
  
  // 计算加权总分
  const total = Math.round(
    0.4 * sensorScore + 
    0.3 * batteryScore + 
    0.3 * communicationScore
  );
  
  // 确定趋势
  const trend = determineTrend(total, history);
  
  // 创建当前记录
  const currentRecord: HealthScoreRecord = {
    timestamp: realTimeData.timestamp,
    score: total
  };
  
  // 限制历史记录数量，保留最新的30条
  const updatedHistory = [currentRecord, ...history].slice(0, 30);
  
  return {
    total,
    sensorScore,
    batteryScore,
    communicationScore,
    lastUpdated: realTimeData.timestamp,
    trend,
    history: updatedHistory
  };
};

/**
 * 计算传感器状态得分
 * @param data 实时数据
 * @returns 传感器得分 (0-100)
 */
const calculateSensorScore = (data: ManholeRealTimeData): number => {
  // 温度评分 (适宜温度范围: -10~40℃)
  let temperatureScore = 100;
  if (data.temperature < -10 || data.temperature > 40) {
    temperatureScore = 0;
  } else if (data.temperature < 0 || data.temperature > 35) {
    temperatureScore = 50;
  } else if (data.temperature < 5 || data.temperature > 30) {
    temperatureScore = 75;
  }
  
  // 水位评分 (正常水位范围: 0~100mm)
  let waterLevelScore = 100;
  if (data.waterLevel > 200) {
    waterLevelScore = 0;
  } else if (data.waterLevel > 150) {
    waterLevelScore = 25;
  } else if (data.waterLevel > 100) {
    waterLevelScore = 50;
  } else if (data.waterLevel > 50) {
    waterLevelScore = 75;
  }
  
  // 气体浓度评分 (CH4浓度: <10ppm安全)
  let gasScore = 100;
  if (data.gasConcentration.ch4 > 200) {
    gasScore = 0;
  } else if (data.gasConcentration.ch4 > 100) {
    gasScore = 25;
  } else if (data.gasConcentration.ch4 > 50) {
    gasScore = 50;
  } else if (data.gasConcentration.ch4 > 10) {
    gasScore = 75;
  }
  
  // 倾斜评分
  let tiltScore = 100;
  const tiltAngle = Math.sqrt(Math.pow(data.tilt.pitch, 2) + Math.pow(data.tilt.roll, 2));
  if (tiltAngle > 20) {
    tiltScore = 0;
  } else if (tiltAngle > 15) {
    tiltScore = 25;
  } else if (tiltAngle > 10) {
    tiltScore = 50;
  } else if (tiltAngle > 5) {
    tiltScore = 75;
  }
  
  // 井盖状态评分
  let coverStatusScore = 100;
  switch (data.coverStatus) {
    case CoverStatus.Closed:
      coverStatusScore = 100;
      break;
    case CoverStatus.PartialOpen:
      coverStatusScore = 50;
      break;
    case CoverStatus.Open:
      coverStatusScore = 0;
      break;
    case CoverStatus.Unknown:
      coverStatusScore = 25;
      break;
  }
  
  // 综合传感器得分计算 (加权平均)
  return Math.round(
    0.25 * temperatureScore + 
    0.25 * waterLevelScore + 
    0.25 * gasScore + 
    0.15 * tiltScore + 
    0.1 * coverStatusScore
  );
};

/**
 * 计算电池状态得分
 * @param batteryLevel 电池电量 (0-100)
 * @returns 电池得分 (0-100)
 */
const calculateBatteryScore = (batteryLevel: number): number => {
  if (batteryLevel >= 80) {
    return 100;
  } else if (batteryLevel >= 60) {
    return 80;
  } else if (batteryLevel >= 40) {
    return 60;
  } else if (batteryLevel >= 20) {
    return 40;
  } else if (batteryLevel >= 10) {
    return 20;
  } else {
    return 0;
  }
};

/**
 * 计算通信状态得分
 * @param signalStrength 信号强度 (0-100)
 * @returns 通信得分 (0-100)
 */
const calculateCommunicationScore = (signalStrength: number): number => {
  if (signalStrength >= 80) {
    return 100;
  } else if (signalStrength >= 60) {
    return 80;
  } else if (signalStrength >= 40) {
    return 60;
  } else if (signalStrength >= 20) {
    return 40;
  } else if (signalStrength >= 10) {
    return 20;
  } else {
    return 0;
  }
};

/**
 * 确定健康评分趋势
 * @param currentScore 当前评分
 * @param history 历史记录
 * @returns 趋势
 */
const determineTrend = (
  currentScore: number, 
  history: HealthScoreRecord[]
): 'rising' | 'falling' | 'stable' => {
  if (history.length < 2) {
    return 'stable';
  }
  
  // 取最近3条记录的平均值进行比较，减少波动影响
  const recentAvg = history.slice(0, Math.min(3, history.length))
    .reduce((sum, record) => sum + record.score, 0) / Math.min(3, history.length);
  
  // 判断趋势
  const diff = currentScore - recentAvg;
  if (Math.abs(diff) < 3) {
    return 'stable';
  } else if (diff > 0) {
    return 'rising';
  } else {
    return 'falling';
  }
};

/**
 * 获取健康评分对应的颜色
 * @param score 健康评分 (0-100)
 * @returns 颜色代码
 */
export const getHealthScoreColor = (score: number): string => {
  if (score >= 90) {
    return '#52c41a'; // 绿色
  } else if (score >= 75) {
    return '#95de64'; // 浅绿色
  } else if (score >= 60) {
    return '#faad14'; // 黄色
  } else if (score >= 40) {
    return '#fa8c16'; // 橙色
  } else if (score >= 25) {
    return '#ff4d4f'; // 红色
  } else {
    return '#f5222d'; // 深红色
  }
};

/**
 * 获取健康评分等级描述
 * @param score 健康评分 (0-100)
 * @returns 等级描述
 */
export const getHealthScoreLevel = (score: number): string => {
  if (score >= 90) {
    return '优';
  } else if (score >= 75) {
    return '良';
  } else if (score >= 60) {
    return '中';
  } else if (score >= 40) {
    return '差';
  } else if (score >= 25) {
    return '劣';
  } else {
    return '危';
  }
}; 