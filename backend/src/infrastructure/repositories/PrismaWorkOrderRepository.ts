import { IWorkOrderRepository } from '../../application/workshop/IWorkOrderRepository';
import { WorkOrder } from '../../domain/workshop/WorkOrder';
import { WorkOrderType } from '../../domain/workshop/WorkOrderType';
import { WorkOrderStatus } from '../../domain/workshop/WorkOrderStatus';
import prisma from '../prisma/prismaClient';

export class PrismaWorkOrderRepository implements IWorkOrderRepository {

  async save(workOrder: WorkOrder): Promise<void> {
    await prisma.workOrder.upsert({
      where: { id: workOrder.id },
      create: {
        id: workOrder.id,
        machineId: workOrder.machineId,
        type: workOrder.type as unknown as import('@prisma/client').WorkOrderType,
        status: workOrder.status as unknown as import('@prisma/client').WorkOrderStatus,
        entryDate: workOrder.entryDate,
        exitDate: workOrder.exitDate,
        sparePartsCost: workOrder.sparePartsCost,
        laborCost: workOrder.laborCost,
        totalCost: workOrder.totalCost,
        downtimeHours: workOrder.downtimeHours,
        createdAt: workOrder.createdAt,
        updatedAt: workOrder.updatedAt,
      },
      update: {
        machineId: workOrder.machineId,
        type: workOrder.type as unknown as import('@prisma/client').WorkOrderType,
        status: workOrder.status as unknown as import('@prisma/client').WorkOrderStatus,
        entryDate: workOrder.entryDate,
        exitDate: workOrder.exitDate,
        sparePartsCost: workOrder.sparePartsCost,
        laborCost: workOrder.laborCost,
        totalCost: workOrder.totalCost,
        downtimeHours: workOrder.downtimeHours,
        updatedAt: new Date(),
      },
    });
  }

  async findById(id: string): Promise<WorkOrder | null> {
    const prismaWorkOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!prismaWorkOrder) return null;

    return this.toDomain(prismaWorkOrder);
  }

  async findByMachineId(machineId: string): Promise<WorkOrder[]> {
    const prismaWorkOrders = await prisma.workOrder.findMany({
      where: { machineId },
    });

    return prismaWorkOrders.map((wo) => this.toDomain(wo));
  }

  // ✅ ESTE MÉTODO TE FALTABA
  async findAll(): Promise<WorkOrder[]> {
    const prismaWorkOrders = await prisma.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return prismaWorkOrders.map((wo) => this.toDomain(wo));
  }

  async delete(id: string): Promise<void> {
    await prisma.workOrder.delete({
      where: { id },
    });
  }

  // 🔥 Método centralizado de mapeo
  private toDomain(prismaWorkOrder: any): WorkOrder {
    return WorkOrder.restore({
      id: prismaWorkOrder.id,
      machineId: prismaWorkOrder.machineId,
      type: this.mapPrismaTypeToDomain(prismaWorkOrder.type),
      status: this.mapPrismaStatusToDomain(prismaWorkOrder.status),
      entryDate: prismaWorkOrder.entryDate,
      exitDate: prismaWorkOrder.exitDate,
      sparePartsCost: prismaWorkOrder.sparePartsCost,
      laborCost: prismaWorkOrder.laborCost,
      totalCost: prismaWorkOrder.totalCost,
      downtimeHours: prismaWorkOrder.downtimeHours,
      createdAt: prismaWorkOrder.createdAt,
      updatedAt: prismaWorkOrder.updatedAt,
    });
  }

  private mapPrismaTypeToDomain(
    prismaType: import('@prisma/client').WorkOrderType
  ): WorkOrderType {
    return WorkOrderType[prismaType as keyof typeof WorkOrderType];
  }

  private mapPrismaStatusToDomain(
    prismaStatus: import('@prisma/client').WorkOrderStatus
  ): WorkOrderStatus {
    return WorkOrderStatus[prismaStatus as keyof typeof WorkOrderStatus];
  }
}
