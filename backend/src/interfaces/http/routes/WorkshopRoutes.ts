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

router.get('/', (req, res) => workshopController.list(req, res));
router.post('/', (req, res) => workshopController.create(req, res));
router.patch('/:id/close', (req, res) => workshopController.close(req, res));
router.put('/:id', (req, res) => workshopController.update(req, res));
router.delete('/:id', (req, res) => workshopController.delete(req, res));

export default router;
