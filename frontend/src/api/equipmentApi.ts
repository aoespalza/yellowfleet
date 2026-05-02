import api from './axios';
import type { Equipment, OperatorEquipmentWithDetails } from '../types/equipment';

export const equipmentApi = {
  // Catálogo
  getCatalog: async (): Promise<Equipment[]> => {
    const response = await api.get('/equipment/catalog');
    return response.data;
  },

  getById: async (id: string): Promise<Equipment> => {
    const response = await api.get(`/equipment/catalog/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    category: string;
    description?: string;
    defaultPeriodicityDays: number;
  }): Promise<Equipment> => {
    const response = await api.post('/equipment/catalog', data);
    return response.data;
  },

  update: async (id: string, data: {
    name?: string;
    category?: string;
    description?: string;
    defaultPeriodicityDays?: number;
    isActive?: boolean;
  }): Promise<Equipment> => {
    const response = await api.put(`/equipment/catalog/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/equipment/catalog/${id}`);
  },

  // Dotación
  deliver: async (data: {
    operatorId: string;
    equipmentId: string;
    quantity?: number;
    notes?: string;
  }): Promise<OperatorEquipmentWithDetails> => {
    const response = await api.post('/equipment/deliver', data);
    return response.data;
  },

  getAllDeliveries: async (): Promise<OperatorEquipmentWithDetails[]> => {
    const response = await api.get('/equipment/deliveries');
    return response.data;
  },

  getOverdue: async (): Promise<OperatorEquipmentWithDetails[]> => {
    const response = await api.get('/equipment/deliveries/overdue');
    return response.data;
  },

  getUpcoming: async (days = 7): Promise<OperatorEquipmentWithDetails[]> => {
    const response = await api.get(`/equipment/deliveries/upcoming?days=${days}`);
    return response.data;
  },

  getByOperator: async (operatorId: string): Promise<OperatorEquipmentWithDetails[]> => {
    const response = await api.get(`/equipment/operator/${operatorId}`);
    return response.data;
  },

  deleteDelivery: async (id: string): Promise<void> => {
    await api.delete(`/equipment/delivery/${id}`);
  },

  // Dotación pendiente por cargo
  getAllPending: async (): Promise<Array<{
    operatorId: string;
    operatorName: string;
    jobId: string | null;
    jobName: string | null;
    pendingItems: Array<{
      equipmentId: string;
      equipmentName: string;
      category: string;
      categoryLabel: string;
    }>;
  }>> => {
    const response = await api.get('/equipment/pending');
    return response.data;
  },

  getPendingByOperator: async (operatorId: string): Promise<{
    operatorId: string;
    operatorName: string;
    jobId: string | null;
    jobName: string | null;
    pendingItems: Array<{
      equipmentId: string;
      equipmentName: string;
      category: string;
      categoryLabel: string;
    }>;
  } | null> => {
    const response = await api.get(`/equipment/pending/${operatorId}`);
    return response.data;
  },
};
