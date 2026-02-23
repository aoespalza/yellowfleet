import api from './axios';
import type { Machine, MachineFormData } from '../types/machine';

export interface LegalDocument {
  id?: string;
  machineId?: string;
  type: string;
  insuranceName?: string | null;
  policyNumber?: string | null;
  expirationDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LegalDocuments {
  POLIZA?: LegalDocument | null;
  SOAT?: LegalDocument | null;
  TECNICO_MECANICA?: LegalDocument | null;
}

export interface MachineDetails {
  id: string;
  code: string;
  type: string;
  brand: string;
  model: string;
  imageUrl?: string;
  year: number;
  serialNumber: string;
  hourMeter: number;
  acquisitionDate: string;
  acquisitionValue: number;
  usefulLifeHours: number;
  status: string;
  currentLocation: string;
  createdAt: string;
  updatedAt: string;
  lastMaintenance: {
    date: string;
    type: string;
    hourMeter: number;
    cost: number;
  } | null;
  currentContract: {
    id: string;
    code: string;
    customer: string;
    startDate: string;
    endDate: string;
    hourlyRate: number;
  } | null;
  contracts: Array<{
    contractId: string;
    contractCode: string;
    customer: string;
    startDate: string;
    endDate: string;
    status: string;
    hourlyRate: number;
    workedHours: number;
    generatedIncome: number;
    maintenanceCost: number;
    margin: number;
  }>;
  profitability: {
    totalWorkedHours: number;
    totalIncome: number;
    totalMaintenanceCost: number;
    totalMargin: number;
    // Days-based metrics
    totalContractDays?: number;
    productiveDays?: number;
    productivityPercentage?: number;
    dailyIncome?: number;
    dailyCost?: number;
    dailyMargin?: number;
  };
  workOrders: Array<{
    id: string;
    type: string;
    status: string;
    entryDate: string;
    exitDate: string | null;
    sparePartsCost: number;
    laborCost: number;
    totalCost: number;
    downtimeHours: number;
  }>;
  workshopSummary: {
    totalVisits: number;
    totalSparePartsCost: number;
    totalLaborCost: number;
    totalCost: number;
    totalDowntimeHours: number;
  };
}

export const machineApi = {
  getAll: async (): Promise<Machine[]> => {
    const response = await api.get('/fleet/machines');
    return response.data;
  },

  getDetails: async (id: string): Promise<MachineDetails> => {
    const response = await api.get(`/fleet/machines/${id}/details`);
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

  updateHourMeter: async (id: string, hourMeter: number): Promise<{ hourMeter: number }> => {
    const response = await api.patch(`/fleet/machines/${id}/hourmeter`, { hourMeter });
    return response.data;
  },

  resetUsefulLifeHours: async (id: string, usefulLifeHours: number): Promise<{
    previousUsefulLifeHours: number;
    newUsefulLifeHours: number;
    currentHourMeter: number;
    hoursRemaining: number;
  }> => {
    const response = await api.patch(`/fleet/machines/${id}/useful-life`, { usefulLifeHours });
    return response.data;
  },

  getHourMeterHistory: async (id: string): Promise<Array<{
    id: string;
    machineId: string;
    userId: string;
    previousValue: number;
    newValue: number;
    createdAt: string;
    user: { username: string };
  }>> => {
    const response = await api.get(`/fleet/machines/${id}/hourmeter-history`);
    return response.data;
  },

  getLegalDocuments: async (machineId: string): Promise<LegalDocuments> => {
    const response = await api.get(`/fleet/machines/${machineId}/legal-documents`);
    return response.data;
  },

  updateLegalDocuments: async (machineId: string, documents: Partial<LegalDocuments>): Promise<LegalDocuments> => {
    const response = await api.put(`/fleet/machines/${machineId}/legal-documents`, documents);
    return response.data;
  },

  getExpiringLegalDocuments: async (days: number = 30): Promise<Array<{
    id: string;
    machineId: string;
    machineCode: string;
    machineName: string;
    documentType: string;
    documentName: string;
    expirationDate: string;
    daysRemaining: number;
    urgency: 'critical' | 'warning' | 'normal';
  }>> => {
    const response = await api.get(`/fleet/legal-documents/expiring?days=${days}`);
    return response.data;
  },
};
