export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Contract {
  id: string;
  code: string;
  customer: string;
  startDate: string;
  endDate: string;
  value: number;
  status: ContractStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractFormData {
  code: string;
  customer: string;
  startDate: string;
  endDate: string;
  value: number;
  status: ContractStatus;
  description: string;
}
