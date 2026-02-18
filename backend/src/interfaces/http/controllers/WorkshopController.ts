import { Request, Response } from 'express';
import { CreateWorkOrder } from '../../../application/workshop/CreateWorkOrder';
import { CloseWorkOrder } from '../../../application/workshop/CloseWorkOrder';
import { ListWorkOrdersByMachine } from '../../../application/workshop/ListWorkOrdersByMachine';
import { PrismaWorkOrderRepository } from '../../../infrastructure/repositories/PrismaWorkOrderRepository';


const workOrderRepository = new PrismaWorkOrderRepository();

export class WorkshopController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const createWorkOrder = new CreateWorkOrder(workOrderRepository);
      await createWorkOrder.execute(req.body);
      res.status(201).json({ message: 'Work order created successfully' });
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
      res.status(200).json(workOrders);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
