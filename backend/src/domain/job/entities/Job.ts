// Tipos de máquinas disponibles en el sistema
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

// Categorías de EPP disponibles
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobDTO {
  name: string;
  description?: string;
  hourlyRate?: number;
  machineTypes: MachineType[];
  equipmentCategories: EquipmentCategory[];
}

export interface UpdateJobDTO {
  name?: string;
  description?: string;
  hourlyRate?: number;
  isActive?: boolean;
  machineTypes?: MachineType[];
  equipmentCategories?: EquipmentCategory[];
}

// Etiquetas para mostrar en UI
export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  AUTOHORMIGONERA: 'Autohormigonera',
  BOMBA_DE_CONCRETO: 'Bomba de Concreto',
  CAMION: 'Camión',
  CAMIONETA: 'Camioneta',
  COMPRESOR_DE_AIRE: 'Compresor de Aire',
  DUMPER: 'Dumper',
  ESCAVADORA: 'Excavadora',
  MINICARGADOR: 'Minicargador',
  MINIEXCAVADORA: 'MiniExcavadora',
  PLANTA_DE_CONCRETO: 'Planta de Concreto',
  TORRE_GRUA: 'Torre Grúa',
};

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  PROTECTION_CRANIAL: 'Protección Craneana (Cascos)',
  PROTECTION_HANDS: 'Protección de Manos (Guantes)',
  PROTECTION_FEET: 'Protección de Pies (Botas)',
  PROTECTION_VISUAL: 'Protección Visual (Gafas)',
  PROTECTION_RESPIRATORY: 'Protección Respiratoria',
  VEST: 'Chalecos',
  PROTECTION_HEARING: 'Protección Auditiva',
  CLOTHING: 'Ropa (Camisas, Pantalones, Chaquetas)',
  OTHER: 'Otros',
};

export const MACHINE_TYPES_LIST: { value: MachineType; label: string }[] = Object.entries(MACHINE_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as MachineType, label })
);

export const EQUIPMENT_CATEGORIES_LIST: { value: EquipmentCategory; label: string }[] = Object.entries(EQUIPMENT_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as EquipmentCategory, label })
);