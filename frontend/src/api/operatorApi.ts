import axios from 'axios';
import type { Operator, OperatorFormData } from '../types/operator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const operatorApi = {
  getAll: async (activeOnly = false): Promise<Operator[]> => {
    const response = await axios.get(`${API_URL}/operators?activeOnly=${activeOnly}`, getAuthHeaders());
    return response.data;
  },

  getById: async (id: string): Promise<Operator> => {
    const response = await axios.get(`${API_URL}/operators/${id}`, getAuthHeaders());
    return response.data;
  },

  create: async (data: OperatorFormData): Promise<Operator> => {
    const response = await axios.post(`${API_URL}/operators`, data, getAuthHeaders());
    return response.data;
  },

  update: async (id: string, data: Partial<OperatorFormData>): Promise<Operator> => {
    const response = await axios.put(`${API_URL}/operators/${id}`, data, getAuthHeaders());
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/operators/${id}`, getAuthHeaders());
  },

  assignToMachine: async (operatorId: string, machineId: string): Promise<void> => {
    await axios.post(`${API_URL}/operators/assign`, { operatorId, machineId }, getAuthHeaders());
  },

  unassignFromMachine: async (machineId: string): Promise<void> => {
    await axios.delete(`${API_URL}/machines/${machineId}/operator`, getAuthHeaders());
  },

  getMachines: async (operatorId: string): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/operators/${operatorId}/machines`, getAuthHeaders());
    return response.data;
  },

  getMachineOperator: async (machineId: string): Promise<Operator | null> => {
    const response = await axios.get(`${API_URL}/machines/${machineId}/operator`, getAuthHeaders());
    return response.data;
  },

  getMachineOperatorHistory: async (machineId: string): Promise<any[]> => {
    const response = await axios.get(`${API_URL}/machines/${machineId}/operator-history`, getAuthHeaders());
    return response.data;
  },
};
