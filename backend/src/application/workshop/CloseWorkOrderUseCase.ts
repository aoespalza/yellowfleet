import { WorkOrderStatus } from '../../domain/workshop/entities/WorkOrder';
import { MachineStatus } from '../../domain/fleet/entities/Machine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CloseWorkOrderDTO {
  id: string;
  sparePartsCost: number;
  laborCost: number;
}

export class CloseWorkOrderUseCase {
  async execute(dto: CloseWorkOrderDTO) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: dto.id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status === WorkOrderStatus.COMPLETED) {
      throw new Error('Work order already completed');
    }

    if (workOrder.status === WorkOrderStatus.CANCELLED) {
      throw new Error('Cannot close cancelled work order');
    }

    const exitDate = new Date();
    const totalCost = dto.sparePartsCost + dto.laborCost;
    const downtimeHours = Math.floor(
      Math.abs(exitDate.getTime() - workOrder.entryDate.getTime()) / 36e5
    );

    const closed = await prisma.workOrder.update({
      where: { id: dto.id },
      data: {
        status: WorkOrderStatus.COMPLETED,
        exitDate,
        sparePartsCost: dto.sparePartsCost,
        laborCost,
        totalCost,
        downtimeHours,
        updatedAt: new Date(),
      },
    });

    await prisma.machine.update({
      where: { id: workOrder.machineId },
      data: {
        status: MachineStatus.AVAILABLE,
        updatedAt: new Date(),
      },
    });

    return closed;
  }
}
