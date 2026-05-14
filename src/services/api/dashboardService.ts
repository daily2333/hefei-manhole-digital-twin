import { apiClient } from './client';
import { DashboardBootstrapResponse } from './types';

export const fetchDashboardBootstrap = async (): Promise<DashboardBootstrapResponse> => {
  const response = await apiClient.get<DashboardBootstrapResponse>('/dashboard/bootstrap');
  return response.data;
};
