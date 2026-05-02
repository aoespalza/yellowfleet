export interface Operator {
  id: string;
  name: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  hireDate?: string;
  isActive: boolean;
  notes?: string;
  photoUrl?: string;
  empresa?: string;
  arl?: string;
  eps?: string;
  grupoSanguineo?: string;
  jobId?: string;
  job?: {
    id: string;
    name: string;
    hourlyRate?: number;
  };
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
  photoUrl?: string;
  empresa?: string;
  arl?: string;
  eps?: string;
  grupoSanguineo?: string;
  jobId?: string;
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
