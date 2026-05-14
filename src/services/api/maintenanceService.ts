import { apiClient } from './client';
import { MaintenanceRecord } from '../../typings';

export const fetchMaintenanceRecords = async (status?: string): Promise<MaintenanceRecord[]> => {
  const params = status ? { status } : undefined;
  const res = await apiClient.get<{ data: MaintenanceRecord[] }>('/maintenance', { params });
  return res.data.data;
};
