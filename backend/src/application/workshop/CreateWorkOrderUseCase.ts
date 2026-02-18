import { WorkOrder, WorkOrderType, WorkOrderStatus } from '../../domain/workshop/entities/WorkOrder';
import { MachineStatus } from '../../domain/fleet/entities/Machine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateWorkOrderDTO {
  machineId: string;
  type: WorkOrderType;
  description?: string;
}

export class CreateWorkOrderUseCase {
  async execute(dto: CreateWorkOrderDTO) {
    const machine = await prisma.machine.findUnique({
      where: { id: dto.machineId },
    });

    if (!machine) {
      throw new Error('Machine not found');
    }

    if (machine.status === MachineStatus.IN_CONTRACT) {
      throw new Error('Cannot create work order: machine is in active contract');
    }

    const workOrder = new WorkOrder({
      machineId: dto.machineId,
      type: dto.type,
      status: WorkOrderStatus.PENDING,
      entryDate: new Date(),
      sparePartsCost: 0,
      laborCost: 0,
      totalCost: 0,
      downtimeHours: 0,
      description: dto.description,
    });

    await prisma.machine.update({
      where: { id: dto.machineId },
      data: { status: MachineStatus.IN_WORKSHOP },
    });

    const created = await prisma.workOrder.create({
      data: workOrder.toPlainObject(),
    });

    return created;
  }
}
