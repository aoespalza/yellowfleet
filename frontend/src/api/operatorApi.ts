import api from './axios';
import type { Operator, OperatorFormData } from '../types/operator';

export const operatorApi = {
  getAll: async (activeOnly = false): Promise<Operator[]> => {
    const response = await api.get(`/operators?activeOnly=${activeOnly}`);
    return response.data;
  },

  getById: async (id: string): Promise<Operator> => {
    const response = await api.get(`/operators/${id}`);
    return response.data;
  },

  create: async (data: OperatorFormData): Promise<Operator> => {
    const response = await api.post('/operators', data);
    return response.data;
  },

  update: async (id: string, data: Partial<OperatorFormData>): Promise<Operator> => {
    const response = await api.put(`/operators/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/operators/${id}`);
  },

  assignToMachine: async (operatorId: string, machineId: string): Promise<void> => {
    await api.post('/operators/assign', { operatorId, machineId });
  },

  unassignFromMachine: async (machineId: string): Promise<void> => {
    await api.delete(`/machines/${machineId}/operator`);
  },

  getMachines: async (operatorId: string): Promise<any[]> => {
    const response = await api.get(`/operators/${operatorId}/machines`);
    return response.data;
  },

  getMachineOperator: async (machineId: string): Promise<Operator | null> => {
    const response = await api.get(`/machines/${machineId}/operator`);
    return response.data;
  },

  getMachineOperatorHistory: async (machineId: string): Promise<any[]> => {
    const response = await api.get(`/machines/${machineId}/operator-history`);
    return response.data;
  },
};
