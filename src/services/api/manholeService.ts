import { apiClient } from './client';
import { ManholeInfo, ManholeRealTimeData } from '../../typings';

export const fetchManholes = async (): Promise<ManholeInfo[]> => {
  const res = await apiClient.get<{ data: ManholeInfo[] }>('/manholes');
  return res.data.data;
};

export const fetchManholeById = async (id: string): Promise<ManholeInfo> => {
  const res = await apiClient.get<{ data: ManholeInfo }>(`/manholes/${id}`);
  return res.data.data;
};

export const fetchRealtimeByManhole = async (id: string): Promise<ManholeRealTimeData> => {
  const res = await apiClient.get<{ data: ManholeRealTimeData }>(`/realtime/${id}`);
  return res.data.data;
};
