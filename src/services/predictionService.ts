import { ManholeRealTimeData, ManholeInfo, ManholeStatus } from '../typings';

interface HistoricalDataPoint {
  timestamp: string;
  value: number;
}

function generateHistoricalData(
  _manholeId: string,
  dataType: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel',
  startTime: string,
  endTime: string
): HistoricalDataPoint[] {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const hours = Math.max(1, Math.floor((end - start) / (60 * 60 * 1000)));

  const baseValues: Record<string, { base: number; amp: number; min: number; max: number }> = {
    temperature: { base: 25, amp: 8, min: -5, max: 55 },
    humidity: { base: 60, amp: 20, min: 10, max: 100 },
    gasConcentration: { base: 5, amp: 10, min: 0, max: 100 },
    waterLevel: { base: 15, amp: 15, min: 0, max: 200 },
    batteryLevel: { base: 85, amp: 10, min: 0, max: 100 },
  };

  const config = baseValues[dataType];
  const seed = _manholeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  function pseudoRandom(offset: number): number {
    const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  return Array.from({ length: hours }, (_, i) => {
    const hour = i % 24;
    const dayCycle = Math.sin((hour - 6) * Math.PI / 12);
    const trend = Math.sin(i * 0.1) * 3;
    const noise = (pseudoRandom(i) - 0.5) * 2;
    let value = config.base + dayCycle * config.amp * 0.5 + trend + noise * 3;
    value = Math.max(config.min, Math.min(config.max, value));
    return {
      timestamp: new Date(start + i * 3600000).toISOString(),
      value: Math.round(value * 100) / 100,
    };
  });
}

function simpleLinearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += data[i]; sumXY += i * data[i]; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function predictFutureValues(data: number[], steps: number): number[] {
  const { slope, intercept } = simpleLinearRegression(data);
  const n = data.length;
  return Array.from({ length: steps }, (_, i) => slope * (n + i) + intercept);
}

export class PredictionService {
  predictFutureTrend(
    manholeId: string,
    dataType: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel'
  ): { timestamp: string; value: number; isActual: boolean }[] {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
    const historicalData = generateHistoricalData(manholeId, dataType, startTime.toISOString(), endTime.toISOString());
    const values = historicalData.map((item) => item.value);
    const predictions = predictFutureValues(values, 24);
    const result = historicalData.map((item) => ({ ...item, isActual: true }));
    const lastTime = new Date(historicalData[historicalData.length - 1].timestamp);
    for (let i = 0; i < predictions.length; i++) {
      const t = new Date(lastTime.getTime() + (i + 1) * 60 * 60 * 1000);
      result.push({ timestamp: t.toISOString(), value: predictions[i], isActual: false });
    }
    return result;
  }

  detectDataAnomalies(
    manholeId: string,
    dataType: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel'
  ): {
    anomalies: { timestamp: string; value: number; zScore: number }[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 48 * 60 * 60 * 1000);
    const historicalData = generateHistoricalData(manholeId, dataType, startTime.toISOString(), endTime.toISOString());
    const values = historicalData.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sq, v) => sq + (v - mean) ** 2, 0) / values.length) || 1;
    const anomalies = historicalData
      .filter((d) => Math.abs((d.value - mean) / std) > 2)
      .map((d) => ({ timestamp: d.timestamp, value: d.value, zScore: Math.abs((d.value - mean) / std) }));
    const maxZ = Math.max(...anomalies.map((a) => a.zScore), 0);
    const riskLevel: 'low' | 'medium' | 'high' = maxZ > 3.5 ? 'high' : maxZ > 2.5 ? 'medium' : 'low';
    return { anomalies, riskLevel };
  }

  predictDeviceHealth(realTimeData: ManholeRealTimeData, status: ManholeStatus, installDate?: string): {
    healthScore: number;
    estimatedLifeRemaining: number;
    riskFactors: string[];
    recommendations: string[];
  } {
    const sensorScore = Math.min(100, Math.max(0, 100 - Math.abs(realTimeData.temperature - 25) * 2));
    const batteryScore = realTimeData.batteryLevel;
    const commScore = Math.min(100, Math.max(0, 50 + realTimeData.signalStrength));
    const healthScore = Math.round(sensorScore * 0.4 + batteryScore * 0.3 + commScore * 0.3);

    let lifeMultiplier = 1;
    if (status === ManholeStatus.Alarm) lifeMultiplier = 0.3;
    else if (status === ManholeStatus.Warning) lifeMultiplier = 0.6;
    else if (status === ManholeStatus.Offline) lifeMultiplier = 0.4;
    else if (status === ManholeStatus.Maintenance) lifeMultiplier = 0.9;
    const estimatedLifeRemaining = Math.round(180 * lifeMultiplier * (healthScore / 100));

    const riskFactors: string[] = [];
    if (realTimeData.temperature > 50) riskFactors.push('温度过高');
    if (realTimeData.batteryLevel < 20) riskFactors.push('电池电量不足');
    if (realTimeData.waterLevel > 50) riskFactors.push('水位过高');
    if (realTimeData.gasConcentration.ch4 > 10) riskFactors.push('甲烷浓度异常');

    const recommendations: string[] = [];
    if (healthScore < 40) recommendations.push('建议立即进行设备检修');
    else if (healthScore < 60) recommendations.push('建议近期安排维护');
    if (realTimeData.batteryLevel < 30) recommendations.push('建议更换电池');
    if (realTimeData.temperature > 45) recommendations.push('检查散热系统');

    return { healthScore, estimatedLifeRemaining, riskFactors, recommendations };
  }

  getLifecyclePrediction(manhole: ManholeInfo): {
    monthsInService: number;
    estimatedMonthsRemaining: number;
    nextRecommendedMaintenance: string;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const installDate = manhole.installationDate ? new Date(manhole.installationDate) : new Date();
    const monthsInService = Math.floor((Date.now() - installDate.getTime()) / (30 * 86400000));

    let estimatedMonthsRemaining = 60 - monthsInService;
    if (manhole.status === ManholeStatus.Alarm) estimatedMonthsRemaining = Math.min(estimatedMonthsRemaining, 6);
    else if (manhole.status === ManholeStatus.Warning) estimatedMonthsRemaining = Math.min(estimatedMonthsRemaining, 18);
    if (estimatedMonthsRemaining < 0) estimatedMonthsRemaining = 1;

    const lastMaint = manhole.lastMaintenanceTime ? new Date(manhole.lastMaintenanceTime) : installDate;
    const nextRecommendedMaintenance = new Date(lastMaint.getTime() + 180 * 86400000).toISOString();

    const riskLevel: 'low' | 'medium' | 'high' = estimatedMonthsRemaining < 6 ? 'high' : estimatedMonthsRemaining < 24 ? 'medium' : 'low';
    return { monthsInService, estimatedMonthsRemaining, nextRecommendedMaintenance, riskLevel };
  }
}

export const predictionService = new PredictionService();
