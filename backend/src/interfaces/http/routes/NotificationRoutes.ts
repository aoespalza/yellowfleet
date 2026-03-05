import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const controller = new NotificationController();

const router = Router();

// Rutas de notificaciones (solo ADMIN)
router.get('/config', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.getConfig(req, res));
router.post('/config', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.saveConfig(req, res));
router.post('/test-connection', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.testConnection(req, res));
router.post('/test-email', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.sendTestEmail(req, res));
router.post('/run', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.runNotifications(req, res));

// Rutas individuales para cada tipo de notificación
router.post('/check/contracts', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.checkContracts(req, res));
router.post('/check/leasing', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.checkLeasing(req, res));
router.post('/check/documents', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.checkDocuments(req, res));
router.post('/check/workorders', authenticateToken, authorizeRole('ADMIN'), (req, res) => controller.checkWorkOrders(req, res));

export default router;
