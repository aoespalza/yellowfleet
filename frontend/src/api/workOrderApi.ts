import api from './axios';
import type { WorkOrder } from '../types/workOrder';

export const workOrderApi = {
  getAll: async (): Promise<WorkOrder[]> => {
    const response = await api.get('/workshop');
    return response.data;
  },

  create: async (data: {
    machineId: string;
    type: string;
    entryDate: Date;
    sparePartsCost: number;
    laborCost: number;
  }): Promise<WorkOrder> => {
    const response = await api.post('/workshop', data);
    return response.data;
  },

  update: async (id: string, data: {
    machineId?: string;
    type?: string;
    entryDate?: Date;
    sparePartsCost?: number;
    laborCost?: number;
  }): Promise<WorkOrder> => {
    const response = await api.put(`/workshop/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workshop/${id}`);
  },
};
