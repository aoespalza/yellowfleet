import { IWorkOrderRepository } from './IWorkOrderRepository';

export class CloseWorkOrder {
  constructor(private workOrderRepository: IWorkOrderRepository) {}

  async execute(id: string, exitDate: Date): Promise<void> {
    const workOrder = await this.workOrderRepository.findById(id);

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    workOrder.completeWorkOrder(exitDate);
    await this.workOrderRepository.save(workOrder);
  }
}
