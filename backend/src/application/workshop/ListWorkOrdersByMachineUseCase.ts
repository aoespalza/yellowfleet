import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ListWorkOrdersByMachineDTO {
  machineId: string;
  page?: number;
  limit?: number;
}

export class ListWorkOrdersByMachineUseCase {
  async execute(dto: ListWorkOrdersByMachineDTO) {
    const machine = await prisma.machine.findUnique({
      where: { id: dto.machineId },
    });

    if (!machine) {
      throw new Error('Machine not found');
    }

    const { page = 1, limit = 20 } = dto;

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where: { machineId: dto.machineId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { entryDate: 'desc' },
      }),
      prisma.workOrder.count({ where: { machineId: dto.machineId } }),
    ]);

    return {
      data: workOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
