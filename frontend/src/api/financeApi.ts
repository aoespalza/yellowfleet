import api from './axios';

export interface FinanceDashboard {
  totalIncome: number;
  totalMaintenanceCost: number;
  totalSparePartsCost: number;
  totalLaborCost: number;
  grossMargin: number;
  marginPercentage: number;
  totalDowntimeHours: number;
  availabilityPercentage: number;
  activeContracts: number;
  machinesInWorkshop: number;
  averageProfitPerMachine: number;
}

export interface MachineProfitability {
  machineId: string;
  machineCode: string;
  totalIncome: number;
  totalMaintenanceCost: number;
  margin: number;
  roi: number;
}

export interface MachineUptime {
  machineId: string;
  machineCode: string;
  totalHours: number;
  workshopHours: number;
  operatingHours: number;
  uptimePercentage: number;
  maintenanceCount: number;
}

export interface WorkshopImpact {
  machineId: string;
  machineCode: string;
  sparePartsCost: number;
  laborCost: number;
  totalCost: number;
  downtimeHours: number;
  maintenanceCount: number;
  lostIncome: number;
  lastMaintenanceDate: string | null;
}

export interface Leasing {
  id: string;
  machineId: string;
  machineCode: string;
  machineBrand: string;
  machineModel: string;
  purchaseValue: number;
  currentBalance: number;
  monthlyPayment: number;
  entity: string;
  startDate: string;
  endDate: string;
  totalPayments: number;
  paidPayments: number;
  remainingPayments: number;
  interestRate: number | null;
  status: string;
  notes: string | null;
}

export interface LeasingSummary {
  totalLeasings: number;
  activeLeasings: number;
  totalPurchaseValue: number;
  totalCurrentBalance: number;
  totalMonthlyPayments: number;
  totalPaidPayments: number;
  totalRemainingPayments: number;
}

export interface LeasingFormData {
  machineId: string;
  purchaseValue: number;
  currentBalance: number;
  monthlyPayment: number;
  entity: string;
  startDate: string;
  endDate: string;
  totalPayments: number;
  interestRate?: number;
  notes?: string;
}

export interface MachineWithoutLeasing {
  id: string;
  code: string;
  brand: string;
  model: string;
  acquisitionValue: number | null;
}

export const financeApi = {
  getDashboard: async (): Promise<FinanceDashboard> => {
    const response = await api.get('/finance/dashboard');
    return response.data;
  },

  getMachinesProfitability: async (): Promise<MachineProfitability[]> => {
    const response = await api.get('/finance/machines/profitability');
    return response.data;
  },

  getMachineUptime: async (): Promise<MachineUptime[]> => {
    const response = await api.get('/finance/machines/uptime');
    return response.data;
  },

  getWorkshopImpact: async (): Promise<WorkshopImpact[]> => {
    const response = await api.get('/finance/workshop/impact');
    return response.data;
  },

  // Leasing
  getLeasings: async (): Promise<Leasing[]> => {
    const response = await api.get('/finance/leasing');
    return response.data;
  },

  getLeasingSummary: async (): Promise<LeasingSummary> => {
    const response = await api.get('/finance/leasing/summary');
    return response.data;
  },

  getMachinesWithoutLeasing: async (): Promise<MachineWithoutLeasing[]> => {
    const response = await api.get('/finance/leasing/machines-available');
    return response.data;
  },

  getLeasingByMachine: async (machineId: string): Promise<Leasing> => {
    const response = await api.get(`/finance/leasing/machine/${machineId}`);
    return response.data;
  },

  createLeasing: async (data: LeasingFormData): Promise<Leasing> => {
    const response = await api.post('/finance/leasing', data);
    return response.data;
  },

  updateLeasing: async (id: string, data: Partial<LeasingFormData>): Promise<Leasing> => {
    const response = await api.put(`/finance/leasing/${id}`, data);
    return response.data;
  },

  deleteLeasing: async (id: string): Promise<void> => {
    await api.delete(`/finance/leasing/${id}`);
  },

  // Leasing Payments
  getPaymentsByLeasing: async (leasingId: string): Promise<LeasingPayment[]> => {
    const response = await api.get(`/finance/leasing/${leasingId}/payments`);
    return response.data;
  },

  createPayment: async (data: LeasingPaymentFormData): Promise<LeasingPayment> => {
    const response = await api.post('/finance/leasing/payments', data);
    return response.data;
  },

  deletePayment: async (id: string): Promise<void> => {
    await api.delete(`/finance/leasing/payments/${id}`);
  },
};

export interface LeasingPayment {
  id: string;
  leasingId: string;
  paymentDate: string;
  amount: number;
  paymentsCount: number;
  totalPaidAfter: number;
  notes: string | null;
  createdAt: string;
}

export interface LeasingPaymentFormData {
  leasingId: string;
  paymentDate: string;
  amount: number;
  paymentsCount: number;
  notes?: string;
}
