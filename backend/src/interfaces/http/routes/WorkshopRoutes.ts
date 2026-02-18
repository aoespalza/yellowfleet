import { Router } from 'express';
import { WorkshopController } from '../controllers/WorkshopController';
import { CreateWorkOrder } from '../../../application/workshop/CreateWorkOrder';
import { CloseWorkOrder } from '../../../application/workshop/CloseWorkOrder';
import { ListWorkOrdersByMachine } from '../../../application/workshop/ListWorkOrdersByMachine';
import { PrismaWorkOrderRepository } from '../../../infrastructure/repositories/PrismaWorkOrderRepository';

const workOrderRepository = new PrismaWorkOrderRepository();

const createWorkOrder = new CreateWorkOrder(workOrderRepository);
const closeWorkOrder = new CloseWorkOrder(workOrderRepository);
const listWorkOrdersByMachine = new ListWorkOrdersByMachine(workOrderRepository);

const workshopController = new WorkshopController();

const router = Router();

router.post('/work-orders', (req, res) => workshopController.create(req, res));
router.patch('/work-orders/:id/close', (req, res) => workshopController.close(req, res));
router.get('/work-orders/machine/:machineId', (req, res) => workshopController.listByMachine(req, res));

export default router;
