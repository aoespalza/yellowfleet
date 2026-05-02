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

export type EquipmentSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export type ClothingType = 'PANTALON' | 'CAMISA' | 'CHAQUETA' | 'POLERA' | 'OTRO';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  clothingType?: ClothingType;
  description?: string;
  defaultPeriodicityDays: number;
  hasSizes: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEquipmentDTO {
  name: string;
  category: EquipmentCategory;
  clothingType?: ClothingType;
  description?: string;
  defaultPeriodicityDays: number;
  hasSizes?: boolean;
}

export interface UpdateEquipmentDTO {
  name?: string;
  category?: EquipmentCategory;
  clothingType?: ClothingType;
  description?: string;
  defaultPeriodicityDays?: number;
  hasSizes?: boolean;
  isActive?: boolean;
}

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

export const EQUIPMENT_SIZES: { value: EquipmentSize; label: string }[] = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
  { value: 'XXXL', label: 'XXXL' },
];

export const CLOTHING_TYPES: { value: ClothingType; label: string }[] = [
  { value: 'PANTALON', label: 'Pantalón' },
  { value: 'CAMISA', label: 'Camisa' },
  { value: 'CHAQUETA', label: 'Chaqueta' },
  { value: 'POLERA', label: 'Polera' },
  { value: 'OTRO', label: 'Otro' },
];