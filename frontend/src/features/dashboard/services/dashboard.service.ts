import api from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import { DashboardStats, ActivityLog, LatestEmployee, LeadDashboardStats } from '../types/dashboard.types';

export const dashboardService = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },

  getRecentActivity: async (): Promise<ApiResponse<ActivityLog[]>> => {
    const res = await api.get('/dashboard/recent-activity');
    return res.data;
  },

  getLatestEmployees: async (): Promise<ApiResponse<LatestEmployee[]>> => {
    const res = await api.get('/dashboard/latest-employees');
    return res.data;
  },

  getLeadStats: async (): Promise<ApiResponse<LeadDashboardStats>> => {
    const res = await api.get('/dashboard/lead-stats');
    return res.data;
  },
};
