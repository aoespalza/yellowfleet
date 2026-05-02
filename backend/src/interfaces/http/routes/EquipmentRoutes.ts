import { Router } from 'express';
import { EquipmentController } from '../controllers/EquipmentController';
import { authenticateToken } from '../middleware/auth';

const controller = new EquipmentController();
const router = Router();

// Rutas públicas
router.get('/catalog', controller.list.bind(controller));
router.get('/catalog/:id', controller.getById.bind(controller));

// Rutas protegidas - Catálogo
router.post('/catalog', authenticateToken, controller.create.bind(controller));
router.put('/catalog/:id', authenticateToken, controller.update.bind(controller));
router.delete('/catalog/:id', authenticateToken, controller.delete.bind(controller));

// Rutas protegidas - Dotación
router.post('/deliver', authenticateToken, controller.deliver.bind(controller));
router.get('/deliveries', controller.getAllDeliveries.bind(controller));
router.get('/deliveries/overdue', controller.getOverdue.bind(controller));
router.get('/deliveries/upcoming', controller.getUpcoming.bind(controller));
router.get('/operator/:operatorId', controller.getOperatorEquipment.bind(controller));
router.delete('/delivery/:id', authenticateToken, controller.deleteDelivery.bind(controller));

// Dotación pendiente por cargo
router.get('/pending', controller.getAllPending.bind(controller));
router.get('/pending/:operatorId', controller.getPendingByOperator.bind(controller));

export default router;
