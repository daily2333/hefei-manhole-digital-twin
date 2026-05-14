import { ManholeRealTimeData, ManholeInfo, ManholeStatus } from '../typings';
import { fetchRealtimeHistory } from './api/manholeService';

interface HistoricalDataPoint {
  timestamp: string;
  value: number;
}

function simpleLinearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += data[i]; sumXY += i * data[i]; sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function predictFutureValues(data: number[], steps: number): number[] {
  const { slope, intercept } = simpleLinearRegression(data);
  const n = data.length;
  return Array.from({ length: steps }, (_, i) => slope * (n + i) + intercept);
}

function extractMetric(data: ManholeRealTimeData, metric: string): number {
  switch (metric) {
    case 'temperature': return data.temperature;
    case 'humidity': return data.humidity;
    case 'waterLevel': return data.waterLevel;
    case 'batteryLevel': return data.batteryLevel;
    case 'gasConcentration': return data.gasConcentration.ch4;
    default: return 0;
  }
}

export class PredictionService {
  async predictFutureTrend(
    manholeId: string,
    dataType: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel'
  ): Promise<{ timestamp: string; value: number; isActual: boolean }[]> {
    const historyData = await fetchRealtimeHistory(manholeId, 48);
    const historicalData: HistoricalDataPoint[] = historyData.map(d => ({
      timestamp: d.timestamp,
      value: extractMetric(d, dataType)
    }));
    if (historicalData.length === 0) return [];
    const values = historicalData.map((item) => item.value);
    const predictions = predictFutureValues(values, 24);
    const result = historicalData.map((item) => ({ ...item, isActual: true }));
    const lastTime = new Date(historicalData[historicalData.length - 1].timestamp);
    for (let i = 0; i < predictions.length; i++) {
      const t = new Date(lastTime.getTime() + (i + 1) * 60 * 60 * 1000);
      result.push({ timestamp: t.toISOString(), value: Math.round(predictions[i] * 100) / 100, isActual: false });
    }
    return result;
  }

  async detectDataAnomalies(
    manholeId: string,
    dataType: 'temperature' | 'humidity' | 'gasConcentration' | 'waterLevel' | 'batteryLevel'
  ): Promise<{
    anomalies: { timestamp: string; value: number; zScore: number }[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const historyData = await fetchRealtimeHistory(manholeId, 100);
    if (historyData.length === 0) return { anomalies: [], riskLevel: 'low' };
    const historicalData: HistoricalDataPoint[] = historyData.map(d => ({
      timestamp: d.timestamp,
      value: extractMetric(d, dataType)
    }));
    const values = historicalData.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sq, v) => sq + (v - mean) ** 2, 0) / values.length) || 1;
    const anomalies = historicalData
      .filter((d) => Math.abs((d.value - mean) / std) > 2)
      .map((d) => ({ timestamp: d.timestamp, value: Math.round(d.value * 100) / 100, zScore: Math.round(Math.abs((d.value - mean) / std) * 100) / 100 }));
    const maxZ = anomalies.length > 0 ? Math.max(...anomalies.map((a) => a.zScore)) : 0;
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
