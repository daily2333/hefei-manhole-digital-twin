import { apiClient } from './client';
import { ManholeAlarm } from '../../typings';

export const fetchAlarms = async (params?: {
  resolved?: boolean;
  level?: string;
  type?: string;
}): Promise<ManholeAlarm[]> => {
  const query: Record<string, string> = {};
  if (params?.resolved !== undefined) query.resolved = String(params.resolved);
  if (params?.level) query.level = params.level;
  if (params?.type) query.type = params.type;
  const res = await apiClient.get<{ data: ManholeAlarm[] }>('/alarms', { params: query });
  return res.data.data;
};

export const resolveAlarm = async (id: string): Promise<void> => {
  await apiClient.put(`/alarms/${id}/resolve`);
};
