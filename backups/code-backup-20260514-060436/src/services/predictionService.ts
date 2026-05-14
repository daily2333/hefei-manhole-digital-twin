import { ManholeRealTimeData, ManholeInfo, ManholeStatus } from '../typings';

// 模拟历史数据生成函数，因为无法导入现有模块，我们将创建一个简单的实现
interface HistoricalDataPoint {
  timestamp: string;
  value: number;
}

/**
 * 生成模拟历史数据
 */
function generateMockHistoricalData(
  manholeId: string,
  dataType: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel',
  startTime: string,
  endTime: string
): HistoricalDataPoint[] {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const hours = Math.floor((end - start) / (60 * 60 * 1000));
  
  // 生成每小时的数据点
  return Array.from({ length: hours }, (_, i) => {
    const timestamp = new Date(start + i * 60 * 60 * 1000).toISOString();
    
    // 根据不同数据类型生成不同范围的随机值
    let value: number;
    switch (dataType) {
      case 'temperature':
        value = 20 + Math.random() * 10;
        break;
      case 'humidity':
        value = 40 + Math.random() * 40;
        break;
      case 'gasConcentration':
        value = 10 + Math.random() * 100;
        break;
      case 'waterLevel':
        value = Math.random() * 50;
        break;
      case 'batteryLevel':
        value = 70 + Math.random() * 30;
        break;
      default:
        value = Math.random() * 100;
    }
    
    return { timestamp, value };
  });
}

/**
 * 基于线性回归的简单预测函数
 */
function simpleLinearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  // 计算均值
  const meanX = x.reduce((sum: number, val: number) => sum + val, 0) / n;
  const meanY = data.reduce((sum: number, val: number) => sum + val, 0) / n;
  
  // 计算线性回归参数
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (data[i] - meanY);
    denominator += (x[i] - meanX) ** 2;
  }
  
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  
  return { slope, intercept };
}

/**
 * 预测未来数值
 */
function predictFutureValues(data: number[], steps: number): number[] {
  const { slope, intercept } = simpleLinearRegression(data);
  const n = data.length;
  
  return Array.from({ length: steps }, (_, i) => {
    const x = n + i;
    return slope * x + intercept;
  });
}

/**
 * 检测异常值
 * 使用简单的Z-score方法
 */
function detectAnomalies(data: number[], threshold = 2.0): number[] {
  const mean = data.reduce((sum: number, val: number) => sum + val, 0) / data.length;
  const squaredDiffs = data.map((val: number) => (val - mean) ** 2);
  const stdDev = Math.sqrt(squaredDiffs.reduce((sum: number, val: number) => sum + val, 0) / data.length);
  
  // 标记Z-score绝对值大于阈值的数据点
  return data.map((val: number, idx: number) => {
    const zScore = Math.abs((val - mean) / stdDev);
    return zScore > threshold ? idx : -1;
  }).filter(idx => idx !== -1);
}

/**
 * 智能预测服务
 */
export class PredictionService {
  /**
   * 预测未来24小时的数据趋势
   */
  predictFutureTrend(
    manholeId: string,
    dataType: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel'
  ): { timestamp: string; value: number; isActual: boolean }[] {
    // 获取过去24小时的历史数据
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
    
    const historicalData = generateMockHistoricalData(
      manholeId,
      dataType,
      startTime.toISOString(),
      endTime.toISOString()
    );
    
    // 提取数值用于预测
    const values = historicalData.map((item: HistoricalDataPoint) => item.value);
    
    // 预测未来24小时
    const predictions = predictFutureValues(values, 24);
    
    // 组合结果
    const result = [
      ...historicalData.map((item: HistoricalDataPoint) => ({ 
        ...item, 
        isActual: true 
      }))
    ];
    
    // 添加预测结果
    const lastTime = new Date(historicalData[historicalData.length - 1].timestamp);
    for (let i = 0; i < predictions.length; i++) {
      const predictTime = new Date(lastTime.getTime() + (i + 1) * 60 * 60 * 1000);
      result.push({
        timestamp: predictTime.toISOString(),
        value: predictions[i],
        isActual: false
      });
    }
    
    return result;
  }
  
  /**
   * 检测数据异常
   */
  detectDataAnomalies(
    manholeId: string,
    dataType: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel'
  ): { 
    anomalies: { timestamp: string; value: number; zScore: number }[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    // 获取过去48小时的历史数据
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 48 * 60 * 60 * 1000);
    
    const historicalData = generateMockHistoricalData(
      manholeId,
      dataType,
      startTime.toISOString(),
      endTime.toISOString()
    );
    
    // 提取数值用于异常检测
    const values = historicalData.map((item: HistoricalDataPoint) => item.value);
    
    // 计算Z-scores
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val: number) => (val - mean) ** 2);
    const stdDev = Math.sqrt(squaredDiffs.reduce((sum: number, val: number) => sum + val, 0) / values.length);
    
    const zScores = values.map((val: number) => (val - mean) / stdDev);
    
    // 查找异常
    const anomalyIndices = zScores
      .map((score: number, idx: number) => ({ score: Math.abs(score), idx }))
      .filter(item => item.score > 2.0)
      .map(item => item.idx);
    
    // 计算风险级别
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (anomalyIndices.length > 5) {
      riskLevel = 'high';
    } else if (anomalyIndices.length > 2) {
      riskLevel = 'medium';
    }
    
    // 组装结果
    const anomalies = anomalyIndices.map((idx: number) => ({
      timestamp: historicalData[idx].timestamp,
      value: historicalData[idx].value,
      zScore: zScores[idx]
    }));
    
    return { anomalies, riskLevel };
  }
  
  /**
   * 预测设备健康状态
   * 返回百分比和预测剩余使用时间
   */
  predictDeviceHealth(manholeInfo: ManholeInfo, recentData: ManholeRealTimeData[]): {
    healthScore: number;
    estimatedLifeRemaining: string;
    recommendations: string[];
  } {
    // 安装时间 
    const installDate = new Date(manholeInfo.installationDate);
    const now = new Date();
    const usageMonths = (now.getFullYear() - installDate.getFullYear()) * 12 + 
                        (now.getMonth() - installDate.getMonth());
                        
    // 计算关键指标变化情况
    const batteryData = recentData.map(d => d.batteryLevel);
    const batteryTrend = simpleLinearRegression(batteryData).slope;
    
    // 电池变化率(每天百分比)
    const batteryChangeRate = batteryTrend * 24; 
    
    // 预估剩余电池寿命(天)
    const latestBattery = batteryData[batteryData.length - 1] || 50;
    let remainingDays = Math.floor(latestBattery / Math.abs(batteryChangeRate));
    
    // 其他因素影响
    if (manholeInfo.status === ManholeStatus.Warning) {
      remainingDays = Math.floor(remainingDays * 0.7);
    } else if (manholeInfo.status === ManholeStatus.Alarm) {
      remainingDays = Math.floor(remainingDays * 0.3);
    }
    
    // 健康评分计算 (满分100)
    let healthScore = 100;
    
    // 电池状况影响(最多30分)
    healthScore -= (100 - latestBattery) * 0.3;
    
    // 使用年限影响(每年最多减5分)
    healthScore -= Math.min(30, (usageMonths / 12) * 5);
    
    // 异常状态影响
    if (manholeInfo.status === ManholeStatus.Warning) {
      healthScore -= 15;
    } else if (manholeInfo.status === ManholeStatus.Alarm) {
      healthScore -= 30;
    } else if (manholeInfo.status === ManholeStatus.Offline) {
      healthScore -= 50;
    }
    
    // 确保评分在0-100范围内
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // 格式化剩余时间
    let estimatedLifeRemaining = '';
    if (remainingDays > 365) {
      estimatedLifeRemaining = `${Math.floor(remainingDays / 365)}年${Math.floor((remainingDays % 365) / 30)}个月`;
    } else if (remainingDays > 30) {
      estimatedLifeRemaining = `${Math.floor(remainingDays / 30)}个月${remainingDays % 30}天`;
    } else {
      estimatedLifeRemaining = `${remainingDays}天`;
    }
    
    // 生成建议
    const recommendations: string[] = [];
    
    if (healthScore < 30) {
      recommendations.push('设备状况严重，建议立即更换');
    } else if (healthScore < 60) {
      recommendations.push('设备健康状况较差，建议安排检修');
    }
    
    if (batteryChangeRate < -2) {
      recommendations.push('电池消耗异常快，需要检查供电系统');
    }
    
    if (manholeInfo.status === ManholeStatus.Warning) {
      recommendations.push('设备处于警告状态，建议排查潜在问题');
    } else if (manholeInfo.status === ManholeStatus.Alarm) {
      recommendations.push('设备处于报警状态，需要立即处理');
    }
    
    if (usageMonths > 36) {
      recommendations.push('设备已使用超过3年，建议进行全面检修');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('设备工作正常，建议按计划进行维护');
    }
    
    return {
      healthScore,
      estimatedLifeRemaining,
      recommendations
    };
  }

  /**
   * 获取生命周期预测
   */
  getLifecyclePrediction(manholeInfo: ManholeInfo): {
    usageMonths: number;
    remainingMonths: number;
    nextMaintenanceDate: string;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    // 安装时间 
    const installDate = new Date(manholeInfo.installationDate);
    const now = new Date();
    const usageMonths = (now.getFullYear() - installDate.getFullYear()) * 12 + 
                        (now.getMonth() - installDate.getMonth());
    const remainingMonths = (now.getFullYear() - installDate.getFullYear()) * 12 + 
                           (now.getMonth() - installDate.getMonth()) % 12;
    const nextMaintenanceDate = new Date(installDate.getTime() + (remainingMonths + 1) * 2629800000).toISOString();
    
    // 计算风险级别
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (remainingMonths < 3) {
      riskLevel = 'high';
    } else if (remainingMonths < 6) {
      riskLevel = 'medium';
    }
    
    return {
      usageMonths,
      remainingMonths,
      nextMaintenanceDate,
      riskLevel
    };
  }
}

export const predictionService = new PredictionService(); 