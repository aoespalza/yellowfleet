import { WorkOrder } from '../../domain/workshop/WorkOrder';

export interface IWorkOrderRepository {
  save(workOrder: WorkOrder): Promise<void>;
  findById(id: string): Promise<WorkOrder | null>;
  findByMachineId(machineId: string): Promise<WorkOrder[]>;
  findAll(): Promise<WorkOrder[]>;
  delete(id: string): Promise<void>;
}
