export type WorkOrderType = 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
export type WorkOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED';

export interface WorkOrder {
  id: string;
  machineId: string;
  machineCode?: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  entryDate: string;
  exitDate: string | null;
  sparePartsCost: number;
  laborCost: number;
  totalCost: number;
  downtimeHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderFormData {
  machineId: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  entryDate: string;
  exitDate: string;
  sparePartsCost: number;
  laborCost: number;
  totalCost: number;
  downtimeHours: number;
}
