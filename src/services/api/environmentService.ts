import { apiClient } from './client';

export interface EnvironmentSummary {
  temperatureData: Array<{ time: string; value: number; max: number; min: number }>;
  humidityData: Array<{ time: string; value: number; max: number; min: number }>;
  gasData: Array<{ time: string; ch4: number; co: number; h2s: number; o2: number }>;
  districtData: Array<{ district: string; avgTemp: number; avgHumidity: number; avgWater: number; manholeCount: number }>;
}

export const fetchEnvironmentSummary = async (period: string = '24h'): Promise<EnvironmentSummary> => {
  const res = await apiClient.get(`/stats/environment-summary?period=${period}`);
  return res.data.data;
};

export interface GasDistribution {
  ch4: number;
  co: number;
  h2s: number;
  o2: number;
}

export const fetchGasDistribution = async (): Promise<GasDistribution> => {
  const res = await apiClient.get('/stats/gas-distribution');
  return res.data.data;
};

export interface CoverStatus {
  closed: number;
  open: number;
  half_open: number;
}

export const fetchCoverStatus = async (): Promise<CoverStatus> => {
  const res = await apiClient.get('/stats/cover-status');
  return res.data.data;
};
