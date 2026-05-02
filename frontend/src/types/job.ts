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

export type EquipmentCategory = 
  | 'PROTECTION_CRANIAL' 
  | 'PROTECTION_HANDS' 
  | 'PROTECTION_FEET' 
  | 'PROTECTION_VISUAL' 
  | 'PROTECTION_RESPIRATORY' 
  | 'VEST' 
  | 'PROTECTION_HEARING' 
  | 'CLOTHING'
  | 'OTHER';

export interface Job {
  id: string;
  name: string;
  description?: string;
  hourlyRate?: number;
  isActive: boolean;
  machineTypes: MachineType[];
  equipmentCategories: EquipmentCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface JobFormData {
  name: string;
  description?: string;
  hourlyRate?: number;
  machineTypes: MachineType[];
  equipmentCategories: EquipmentCategory[];
}

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

export const EQUIPMENT_CATEGORIES: { value: EquipmentCategory; label: string }[] = [
  { value: 'PROTECTION_CRANIAL', label: 'Protección Craneana (Cascos)' },
  { value: 'PROTECTION_HANDS', label: 'Protección de Manos (Guantes)' },
  { value: 'PROTECTION_FEET', label: 'Protección de Pies (Botas)' },
  { value: 'PROTECTION_VISUAL', label: 'Protección Visual (Gafas)' },
  { value: 'PROTECTION_RESPIRATORY', label: 'Protección Respiratoria' },
  { value: 'VEST', label: 'Chalecos' },
  { value: 'PROTECTION_HEARING', label: 'Protección Auditiva' },
  { value: 'CLOTHING', label: 'Ropa (Camisas, Pantalones, Chaquetas)' },
  { value: 'OTHER', label: 'Otros' },
];