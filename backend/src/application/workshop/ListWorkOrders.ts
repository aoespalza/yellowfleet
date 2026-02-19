import { IWorkOrderRepository } from './IWorkOrderRepository';
import { WorkOrder } from '../../domain/workshop/WorkOrder';

export class ListWorkOrders {
  constructor(private workOrderRepository: IWorkOrderRepository) {}

  async execute(): Promise<WorkOrder[]> {
    return this.workOrderRepository.findAll();
  }
}
