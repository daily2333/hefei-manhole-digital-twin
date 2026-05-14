import { apiClient } from './client';

export const fetchOverview = async (): Promise<{
  totalManholes: number;
  statusDistribution: Record<string, number>;
  unresolvedAlarms: number;
  pendingMaintenance: number;
  averageHealthScore: number;
}> => {
  const res = await apiClient.get('/stats/overview');
  return res.data.data;
};
