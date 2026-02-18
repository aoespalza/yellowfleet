import { IWorkOrderRepository } from './IWorkOrderRepository';
import { WorkOrder } from '../../domain/workshop/WorkOrder';

export class ListWorkOrdersByMachine {
  constructor(private workOrderRepository: IWorkOrderRepository) {}

  async execute(machineId: string): Promise<WorkOrder[]> {
    return this.workOrderRepository.findByMachineId(machineId);
  }
}
