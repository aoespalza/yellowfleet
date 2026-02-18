import { IWorkOrderRepository } from './IWorkOrderRepository';
import { WorkOrder } from '../../domain/workshop/WorkOrder';
import { WorkOrderType } from '../../domain/workshop/WorkOrderType';
import { WorkOrderStatus } from '../../domain/workshop/WorkOrderStatus';

export interface CreateWorkOrderInput {
  machineId: string;
  type: WorkOrderType;
  entryDate: Date;
  sparePartsCost: number;
  laborCost: number;
}

export class CreateWorkOrder {
  constructor(private workOrderRepository: IWorkOrderRepository) {}

  async execute(input: CreateWorkOrderInput): Promise<void> {
    const workOrder = WorkOrder.create({
      machineId: input.machineId,
      type: input.type,
      status: WorkOrderStatus.OPEN,
      entryDate: input.entryDate,
      sparePartsCost: input.sparePartsCost,
      laborCost: input.laborCost,
      totalCost: 0,
    });

    await this.workOrderRepository.save(workOrder);
  }
}
