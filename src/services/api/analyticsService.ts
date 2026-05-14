import { apiClient } from './client';

export interface AnalyticsData {
  trendData: Array<{ date: string; temperature: number; humidity: number; waterLevel: number; gasConcentration: number; batteryLevel: number }>;
  distributionData: Array<{ area: string; temperature: number; humidity: number; waterLevel: number; gasConcentration: number }>;
  correlationData: Array<{ metric1: string; metric2: string; coefficient: number }>;
  anomalyData: Array<{ date: string; value: number; anomalyScore: number; isAnomaly: boolean; metric: string }>;
  comparisonData: Array<{ area: string; metric: string; current: number; previous: number; change: number }>;
}

export const fetchAnalyticsData = async (dataType: string, days: number = 30): Promise<AnalyticsData> => {
  const res = await apiClient.get(`/stats/analytics?dataType=${dataType}&days=${days}`);
  return res.data.data;
};

export interface ReportData {
  deviceReport: Array<{ name: string; uptime: number; alarmCount: number; maintenanceCount: number; batteryAvg: number; lastDataTime: string }>;
  areaReport: Array<{ area: string; deviceCount: number; onlineRate: number; alarms: number; avgHealth: number }>;
  statusReport: { normal: number; warning: number; alarm: number; offline: number; batteryAvg: number; signalAvg: number; weekOverWeek: number };
  alarmReport: { total: number; resolved: number; resolveRate: number; avgResponseTime: number; byLevel: Record<string, number> };
  maintenanceReport: { total: number; completed: number; completionRate: number; avgDuration: number; byType: Record<string, number> };
}

export const fetchReportData = async (days: number = 7): Promise<ReportData> => {
  const res = await apiClient.get(`/stats/report?days=${days}`);
  return res.data.data;
};

export interface DistrictSummary {
  districts: Array<{ district: string; manholeCount: number; alarmCount: number; avgHealth: number; onlineRate: number }>;
}

export const fetchDistrictSummary = async (): Promise<DistrictSummary> => {
  const res = await apiClient.get('/stats/district-summary');
  return res.data.data;
};
