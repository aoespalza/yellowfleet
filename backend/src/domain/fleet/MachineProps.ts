import { MachineStatus } from './MachineStatus';

export interface MachineProps {
  id?: string;
  code: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  serialNumber: string;
  hourMeter: number;
  acquisitionDate: Date;
  acquisitionValue: number;
  usefulLifeHours: number;
  status: MachineStatus;
  currentLocation: string;
  createdAt?: Date;
  updatedAt?: Date;
}
