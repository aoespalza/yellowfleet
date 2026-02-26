import { Request, Response } from 'express';
import { CreateWorkOrder } from '../../../application/workshop/CreateWorkOrder';
import { CloseWorkOrder } from '../../../application/workshop/CloseWorkOrder';
import { ListWorkOrdersByMachine } from '../../../application/workshop/ListWorkOrdersByMachine';
import { ListWorkOrders } from '../../../application/workshop/ListWorkOrders';
import { PrismaWorkOrderRepository } from '../../../infrastructure/repositories/PrismaWorkOrderRepository';
import { WorkOrderType } from '../../../domain/workshop/WorkOrderType';
import { WorkOrderStatus } from '../../../domain/workshop/WorkOrderStatus';
import { MachineStatus } from '../../../domain/fleet/MachineStatus';
import { prisma } from '../../../infrastructure/database/prisma';


const workOrderRepository = new PrismaWorkOrderRepository();


export class WorkshopController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const { machineId, type, entryDate, sparePartsCost, laborCost } = req.body;
      
      console.log('[WorkshopController] Received data:', { machineId, type, entryDate, sparePartsCost, laborCost });

      // Check if machine already has an active work order
      const activeWorkOrders = await prisma.workOrder.findMany({
        where: {
          machineId,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] },
        },
      });

      if (activeWorkOrders.length > 0) {
        res.status(400).json({ error: 'La máquina ya tiene una orden de trabajo activa' });
        return;
      }

      // Save current machine status as previousStatus before changing to IN_WORKSHOP
      const machine = await prisma.machine.findUnique({ where: { id: machineId } });
      if (machine) {
        await prisma.machine.update({
          where: { id: machineId },
          data: { 
            previousStatus: machine.status as any,
            status: 'IN_WORKSHOP' as any,
          },
        });
      }

      // Convert string to enum
      const workOrderType = WorkOrderType[type as keyof typeof WorkOrderType];

      // Parse date as local time (not UTC)
      const parseLocalDate = (dateStr: string): Date => {
        // Handle both formats: "2026-02-23" and "2026-02-23T00:00:00.000Z"
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const createWorkOrder = new CreateWorkOrder(workOrderRepository);
      await createWorkOrder.execute({
        machineId,
        type: workOrderType,
        entryDate: parseLocalDate(entryDate),
        sparePartsCost: Number(sparePartsCost),
        laborCost: Number(laborCost),
      });

      // Update machine status to IN_WORKSHOP
      await prisma.machine.update({
        where: { id: machineId },
        data: { status: MachineStatus.IN_WORKSHOP },
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
      const { exitDate, sparePartsCost = 0, laborCost = 0 } = req.body;
      const closeWorkOrder = new CloseWorkOrder(workOrderRepository);
      await closeWorkOrder.execute(id, new Date(exitDate), sparePartsCost, laborCost);

      // Find the work order to get machineId
      const workOrder = await prisma.workOrder.findUnique({ where: { id } });
      if (workOrder) {
        // Get machine to restore previous status
        const machine = await prisma.machine.findUnique({ where: { id: workOrder.machineId } });
        
        // Restore previous status if exists, otherwise set to AVAILABLE
        const newStatus = machine?.previousStatus || 'AVAILABLE';
        
        // Si es mantenimiento preventivo, reiniciar horas de mantenimiento
        const orderType = String(workOrder.type);
        const updateData: any = { 
          status: newStatus,
          previousStatus: null,
        };
        
        if (orderType === 'PREVENTIVE') {
          updateData.hoursSinceLastMaintenance = 0;
          updateData.lastMaintenanceDate = new Date(exitDate);
        }
        
        await prisma.machine.update({
          where: { id: workOrder.machineId },
          data: updateData,
        });
      }

      // Return the updated work order with downtimeHours calculated
      const updatedWorkOrder = await prisma.workOrder.findUnique({ where: { id } });
      res.status(200).json(updatedWorkOrder);
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
      
      // Find the work order first to get machineId
      const workOrder = await prisma.workOrder.findUnique({ where: { id } });
      
      await prisma.workOrder.delete({ where: { id } });

      // If deleted work order was active, update machine status
      if (workOrder && ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'].includes(workOrder.status)) {
        // Check if there are other active work orders for this machine
        const activeOrders = await prisma.workOrder.count({
          where: {
            machineId: workOrder.machineId,
            status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'] },
          },
        });
        
        // Only update to AVAILABLE if no other active orders
        if (activeOrders === 0) {
          await prisma.machine.update({
            where: { id: workOrder.machineId },
            data: { status: MachineStatus.AVAILABLE },
          });
        }
      }

      res.status(200).json({ message: 'Work order deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status transitions
      const workOrder = await prisma.workOrder.findUnique({ where: { id } });
      if (!workOrder) {
        res.status(404).json({ error: 'Work order not found' });
        return;
      }

      // Only allow status changes for active work orders
      if (!['OPEN', 'IN_PROGRESS', 'WAITING_PARTS'].includes(workOrder.status)) {
        res.status(400).json({ error: 'No se puede modificar una orden cerrada o cancelada' });
        return;
      }

      // Update status
      await prisma.workOrder.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date(),
        },
      });

      res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const logs = await prisma.workOrderLog.findMany({
        where: { workOrderId: id },
        orderBy: { date: 'desc' },
      });

      res.status(200).json(logs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async addLog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { description } = req.body;

      // Check if work order exists
      const workOrder = await prisma.workOrder.findUnique({ where: { id } });
      if (!workOrder) {
        res.status(404).json({ error: 'Work order not found' });
        return;
      }

      const log = await prisma.workOrderLog.create({
        data: {
          workOrderId: id,
          description,
          date: new Date(),
        },
      });

      res.status(201).json(log);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async deleteLog(req: Request, res: Response): Promise<void> {
    try {
      const { logId } = req.params;
      
      await prisma.workOrderLog.delete({
        where: { id: logId },
      });

      res.status(200).json({ message: 'Log deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
