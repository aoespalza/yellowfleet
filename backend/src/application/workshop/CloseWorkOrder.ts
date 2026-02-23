import { IWorkOrderRepository } from './IWorkOrderRepository';

export class CloseWorkOrder {
  constructor(private workOrderRepository: IWorkOrderRepository) {}

  async execute(id: string, exitDate: Date, sparePartsCost: number = 0, laborCost: number = 0): Promise<void> {
    const workOrder = await this.workOrderRepository.findById(id);

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    workOrder.completeWorkOrder(exitDate, sparePartsCost, laborCost);
    await this.workOrderRepository.save(workOrder);
  }
}
