import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const roleController = new RoleController();

const router = Router();

// Rutas de roles (solo ADMIN)
router.get('/', authenticateToken, authorizeRole('ADMIN'), (req, res) => roleController.list(req, res));
router.get('/:name', authenticateToken, authorizeRole('ADMIN'), (req, res) => roleController.get(req, res));
router.post('/', authenticateToken, authorizeRole('ADMIN'), (req, res) => roleController.create(req, res));
router.put('/:name', authenticateToken, authorizeRole('ADMIN'), (req, res) => roleController.update(req, res));
router.delete('/:name', authenticateToken, authorizeRole('ADMIN'), (req, res) => roleController.delete(req, res));

export default router;
