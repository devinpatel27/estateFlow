import api from '@/lib/axios';
import { ApiResponse } from '@/types/api.types';
import { MasterItem } from '../types/lead.types';

export const masterService = {
  listPropertyTypes: async (activeOnly = false): Promise<ApiResponse<MasterItem[]>> => {
    const res = await api.get('/property-types', { params: activeOnly ? { active: 'true' } : {} });
    return res.data;
  },

  createPropertyType: async (data: { name: string; status?: string }): Promise<ApiResponse<MasterItem>> => {
    const res = await api.post('/property-types', data);
    return res.data;
  },

  updatePropertyType: async (id: string, data: Partial<MasterItem>): Promise<ApiResponse<MasterItem>> => {
    const res = await api.put(`/property-types/${id}`, data);
    return res.data;
  },

  deletePropertyType: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/property-types/${id}`);
    return res.data;
  },

  listLeadSources: async (activeOnly = false): Promise<ApiResponse<MasterItem[]>> => {
    const res = await api.get('/lead-sources', { params: activeOnly ? { active: 'true' } : {} });
    return res.data;
  },

  createLeadSource: async (data: { name: string; status?: string }): Promise<ApiResponse<MasterItem>> => {
    const res = await api.post('/lead-sources', data);
    return res.data;
  },

  updateLeadSource: async (id: string, data: Partial<MasterItem>): Promise<ApiResponse<MasterItem>> => {
    const res = await api.put(`/lead-sources/${id}`, data);
    return res.data;
  },

  deleteLeadSource: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete(`/lead-sources/${id}`);
    return res.data;
  },
};
