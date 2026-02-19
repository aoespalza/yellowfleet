import { Router } from 'express';
import { WorkshopController } from '../controllers/WorkshopController';
import { CreateWorkOrder } from '../../../application/workshop/CreateWorkOrder';
import { CloseWorkOrder } from '../../../application/workshop/CloseWorkOrder';
import { ListWorkOrdersByMachine } from '../../../application/workshop/ListWorkOrdersByMachine';
import { PrismaWorkOrderRepository } from '../../../infrastructure/repositories/PrismaWorkOrderRepository';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const workOrderRepository = new PrismaWorkOrderRepository();

const createWorkOrder = new CreateWorkOrder(workOrderRepository);
const closeWorkOrder = new CloseWorkOrder(workOrderRepository);
const listWorkOrdersByMachine = new ListWorkOrdersByMachine(workOrderRepository);

const workshopController = new WorkshopController();

const router = Router();

// Rutas públicas (solo lectura)
router.get('/', (req, res) => workshopController.list(req, res));

// Rutas protegidas (requieren autenticación y rol ADMIN o MANAGER)
router.post('/', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.create(req, res));

// Logs - debe venir antes de :id
router.get('/:id/logs', (req, res) => workshopController.getLogs(req, res));
router.post('/:id/logs', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.addLog(req, res));

router.patch('/:id/close', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.close(req, res));
router.patch('/:id/status', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.updateStatus(req, res));
router.put('/:id', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.update(req, res));
router.delete('/:id', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.delete(req, res));

// Logs delete - debe venir después de :id
router.delete('/logs/:logId', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.deleteLog(req, res));

export default router;
