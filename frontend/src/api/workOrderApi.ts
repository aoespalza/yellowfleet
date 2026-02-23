import api from './axios';
import type { WorkOrder } from '../types/workOrder';

export interface WorkOrderLog {
  id: string;
  workOrderId: string;
  machineCode?: string;
  date: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
}

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

  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.patch(`/workshop/${id}/status`, { status });
  },

  close: async (id: string, exitDate: Date, sparePartsCost: number = 0, laborCost: number = 0): Promise<void> => {
    await api.patch(`/workshop/${id}/close`, { exitDate, sparePartsCost, laborCost });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workshop/${id}`);
  },

  // Logs
  getLogs: async (workOrderId: string): Promise<WorkOrderLog[]> => {
    const response = await api.get(`/workshop/${workOrderId}/logs`);
    return response.data;
  },

  addLog: async (workOrderId: string, description: string): Promise<WorkOrderLog> => {
    const response = await api.post(`/workshop/${workOrderId}/logs`, { description });
    return response.data;
  },

  // Upload file with log
  uploadLogWithFile: async (workOrderId: string, description: string, file: File): Promise<WorkOrderLog> => {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('file', file);
    
    const response = await api.post(`/workshop/${workOrderId}/logs/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteLog: async (logId: string): Promise<void> => {
    await api.delete(`/workshop/logs/${logId}`);
  },
};
