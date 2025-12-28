import api from './api';
import type { DashboardResponse } from '@/types/dashboard';

export const dashboardService = {
  async getStatistics(): Promise<DashboardResponse> {
    const response = await api.get<DashboardResponse>('/dashboard/statistics');
    return response.data;
  },
};

