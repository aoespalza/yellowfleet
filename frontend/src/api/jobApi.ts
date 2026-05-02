import type { Job, JobFormData } from '../types/job';
import api from './axios';

export const jobApi = {
  getAll: async (): Promise<Job[]> => {
    const response = await api.get('/jobs');
    return response.data;
  },

  getById: async (id: string): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  create: async (data: JobFormData): Promise<Job> => {
    const response = await api.post('/jobs', data);
    return response.data;
  },

  update: async (id: string, data: Partial<JobFormData>): Promise<Job> => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/jobs/${id}`);
  },

  getByMachineType: async (machineType: string): Promise<Job[]> => {
    const response = await api.get(`/jobs/machine-type/${machineType}`);
    return response.data;
  },

  getByEquipmentCategory: async (category: string): Promise<Job[]> => {
    const response = await api.get(`/jobs/equipment-category/${category}`);
    return response.data;
  },
};