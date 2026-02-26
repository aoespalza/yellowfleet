export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Contract {
  id: string;
  code: string;
  customer: string;
  startDate: string;
  endDate: string;
  value: number;
  monthlyValue?: number;
  plazo?: number;
  status: ContractStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  machineCount: number;
}

export interface ContractFormData {
  code: string;
  customer: string;
  startDate: string;
  endDate: string;
  value: string;
  monthlyValue?: string;
  plazo?: string;
  status: ContractStatus;
  description: string;
}
