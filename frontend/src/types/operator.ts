export interface Operator {
  id: string;
  name: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperatorFormData {
  name: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  notes?: string;
  isActive?: boolean;
}

export interface MachineOperatorAssignment {
  id: string;
  operatorId: string;
  operatorName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}
