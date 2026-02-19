import { Request, Response } from 'express';
import { CreateWorkOrder } from '../../../application/workshop/CreateWorkOrder';
import { CloseWorkOrder } from '../../../application/workshop/CloseWorkOrder';
import { ListWorkOrdersByMachine } from '../../../application/workshop/ListWorkOrdersByMachine';
import { ListWorkOrders } from '../../../application/workshop/ListWorkOrders';
import { PrismaWorkOrderRepository } from '../../../infrastructure/repositories/PrismaWorkOrderRepository';
import { WorkOrderType } from '../../../domain/workshop/WorkOrderType';
import { WorkOrderStatus } from '../../../domain/workshop/WorkOrderStatus';
import { prisma } from '../../../infrastructure/database/prisma';


const workOrderRepository = new PrismaWorkOrderRepository();


export class WorkshopController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const { machineId, type, entryDate, sparePartsCost, laborCost } = req.body;

      // Convert string to enum
      const workOrderType = WorkOrderType[type as keyof typeof WorkOrderType];

      const createWorkOrder = new CreateWorkOrder(workOrderRepository);
      await createWorkOrder.execute({
        machineId,
        type: workOrderType,
        entryDate: new Date(entryDate),
        sparePartsCost: Number(sparePartsCost),
        laborCost: Number(laborCost),
      });
      
      // Fetch the created work order to return it
      const listWorkOrders = new ListWorkOrders(workOrderRepository);
      const workOrders = await listWorkOrders.execute();
      const createdWorkOrder = workOrders[0];
      
      const plainWorkOrder = {
        id: createdWorkOrder.id,
        machineId: createdWorkOrder.machineId,
        type: createdWorkOrder.type,
        status: createdWorkOrder.status,
        entryDate: createdWorkOrder.entryDate,
        exitDate: createdWorkOrder.exitDate,
        sparePartsCost: createdWorkOrder.sparePartsCost,
        laborCost: createdWorkOrder.laborCost,
        totalCost: createdWorkOrder.totalCost,
        downtimeHours: createdWorkOrder.downtimeHours,
        createdAt: createdWorkOrder.createdAt,
        updatedAt: createdWorkOrder.updatedAt,
      };
      
      res.status(201).json(plainWorkOrder);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async close(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { exitDate } = req.body;
      const closeWorkOrder = new CloseWorkOrder(workOrderRepository);
      await closeWorkOrder.execute(id, new Date(exitDate));
      res.status(200).json({ message: 'Work order closed successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Work order not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }

  public async listByMachine(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const listWorkOrders = new ListWorkOrdersByMachine(workOrderRepository);
      const workOrders = await listWorkOrders.execute(machineId);
      
      const plainWorkOrders = workOrders.map((wo) => ({
        id: wo.id,
        machineId: wo.machineId,
        type: wo.type,
        status: wo.status,
        entryDate: wo.entryDate,
        exitDate: wo.exitDate,
        sparePartsCost: wo.sparePartsCost,
        laborCost: wo.laborCost,
        totalCost: wo.totalCost,
        downtimeHours: wo.downtimeHours,
        createdAt: wo.createdAt,
        updatedAt: wo.updatedAt,
      }));
      
      res.status(200).json(plainWorkOrders);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const listWorkOrders = new ListWorkOrders(workOrderRepository);
      const workOrders = await listWorkOrders.execute();
      
      // Map to plain objects
      const plainWorkOrders = workOrders.map((wo) => ({
        id: wo.id,
        machineId: wo.machineId,
        type: wo.type,
        status: wo.status,
        entryDate: wo.entryDate,
        exitDate: wo.exitDate,
        sparePartsCost: wo.sparePartsCost,
        laborCost: wo.laborCost,
        totalCost: wo.totalCost,
        downtimeHours: wo.downtimeHours,
        createdAt: wo.createdAt,
        updatedAt: wo.updatedAt,
      }));
      
      res.status(200).json(plainWorkOrders);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { type, entryDate, sparePartsCost, laborCost, status } = req.body;

      const workOrderType = type ? WorkOrderType[type as keyof typeof WorkOrderType] : undefined;

      // Update in repository directly
      const updatedData: any = {};
      if (type) updatedData.type = workOrderType;
      if (entryDate) updatedData.entryDate = new Date(entryDate);
      if (sparePartsCost !== undefined) updatedData.sparePartsCost = Number(sparePartsCost);
      if (laborCost !== undefined) updatedData.laborCost = Number(laborCost);
      if (status) updatedData.status = status;
      updatedData.updatedAt = new Date();

      await prisma.workOrder.update({
        where: { id },
        data: updatedData,
      });

      const plainWorkOrder = {
        id,
        ...updatedData,
      };

      res.status(200).json(plainWorkOrder);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.workOrder.delete({ where: { id } });
      res.status(200).json({ message: 'Work order deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
