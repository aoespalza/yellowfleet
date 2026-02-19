import api from './axios';
import type { Contract, ContractFormData } from '../types/contract';

export const contractApi = {
  getAll: async (): Promise<Contract[]> => {
    const response = await api.get('/contracts');
    return response.data;
  },

  create: async (data: ContractFormData): Promise<Contract> => {
    const response = await api.post('/contracts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ContractFormData>): Promise<Contract> => {
    const response = await api.put(`/contracts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contracts/${id}`);
  },
};
