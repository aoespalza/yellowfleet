import { EquipmentSize } from './Equipment';

export interface OperatorEquipment {
  id: string;
  operatorId: string;
  equipmentId: string;
  deliveryDate: Date;
  nextDeliveryDate: Date;
  quantity: number;
  size?: EquipmentSize;
  notes?: string;
  deliveredBy?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (optional)
  equipmentName?: string;
  operatorName?: string;
}

export interface CreateOperatorEquipmentDTO {
  operatorId: string;
  equipmentId: string;
  deliveryDate?: Date;
  quantity?: number;
  size?: EquipmentSize;
  notes?: string;
  deliveredBy?: string;
}

export interface OperatorEquipmentWithDetails extends OperatorEquipment {
  equipment: {
    id: string;
    name: string;
    category: string;
    defaultPeriodicityDays: number;
    hasSizes: boolean;
  };
  operator: {
    id: string;
    name: string;
  };
}