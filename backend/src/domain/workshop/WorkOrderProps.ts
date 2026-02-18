import { WorkOrderType } from './WorkOrderType';
import { WorkOrderStatus } from './WorkOrderStatus';

export interface WorkOrderProps {
  id?: string;
  machineId: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  entryDate: Date;
  exitDate?: Date;
  sparePartsCost: number;
  laborCost: number;
  totalCost: number;
  downtimeHours?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
