export type MachineStatus = 'AVAILABLE' | 'IN_CONTRACT' | 'IN_WORKSHOP' | 'IN_TRANSFER' | 'INACTIVE';

export interface Machine {
  id: string;
  code: string;
  type: string;
  brand: string;
  model: string;
  imageUrl?: string;
  year: number;
  serialNumber: string;
  hourMeter: null;
  acquisitionDate: null;
  acquisitionValue: null;
  usefulLifeHours: null;
  // Mantenimiento preventivo
  hoursSinceLastMaintenance?: number;
  maintenanceIntervalHours?: number;
  lastMaintenanceDate?: string;
  status: MachineStatus;
  currentLocation: null;
  createdAt: string;
  updatedAt: string;
}

export interface MachineFormData {
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
  currentLocation: string;
}
