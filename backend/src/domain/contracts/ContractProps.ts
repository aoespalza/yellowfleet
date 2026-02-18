import { ContractStatus } from './ContractStatus';

export interface ContractProps {
  id?: string;
  code: string;
  customer: string;
  startDate: Date;
  endDate: Date;
  value: number;
  status: ContractStatus;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
