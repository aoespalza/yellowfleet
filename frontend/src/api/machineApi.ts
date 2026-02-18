import api from './axios';
import type { Machine, MachineFormData } from '../types/machine';


export const machineApi = {
  getAll: async (): Promise<Machine[]> => {
    const response = await api.get('/fleet/machines');
    return response.data;
  },

  create: async (data: MachineFormData): Promise<Machine> => {
    const response = await api.post('/fleet/machines', {
      ...data,
      acquisitionDate: new Date(data.acquisitionDate),
    });
    return response.data;
  },
  
  update: async (id: string, data: Partial<MachineFormData>): Promise<Machine> => {
    const response = await api.put(`/fleet/machines/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/fleet/machines/${id}`);
  },
};
