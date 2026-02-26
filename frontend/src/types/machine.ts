export type MachineStatus = 'AVAILABLE' | 'IN_CONTRACT' | 'IN_WORKSHOP' | 'IN_TRANSFER' | 'INACTIVE';

export type MachineType = 
  | 'AUTOHORMIGONERA'
  | 'BOMBA_DE_CONCRETO'
  | 'CAMION'
  | 'CAMIONETA'
  | 'COMPRESOR_DE_AIRE'
  | 'DUMPER'
  | 'ESCAVADORA'
  | 'MINICARGADOR'
  | 'MINIEXCAVADORA'
  | 'PLANTA_DE_CONCRETO'
  | 'TORRE_GRUA';

export const MACHINE_TYPES: { value: MachineType; label: string }[] = [
  { value: 'AUTOHORMIGONERA', label: 'Autohormigonera' },
  { value: 'BOMBA_DE_CONCRETO', label: 'Bomba de Concreto' },
  { value: 'CAMION', label: 'Camión' },
  { value: 'CAMIONETA', label: 'Camioneta' },
  { value: 'COMPRESOR_DE_AIRE', label: 'Compresor de Aire' },
  { value: 'DUMPER', label: 'Dumper' },
  { value: 'ESCAVADORA', label: 'Excavadora' },
  { value: 'MINICARGADOR', label: 'Minicargador' },
  { value: 'MINIEXCAVADORA', label: 'MiniExcavadora' },
  { value: 'PLANTA_DE_CONCRETO', label: 'Planta de Concreto' },
  { value: 'TORRE_GRUA', label: 'Torre Grúa' },
];

export interface Machine {
  id: string;
  code: string;
  type: MachineType;
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
  commercialValue?: number;
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
  commercialValue?: number;
}
