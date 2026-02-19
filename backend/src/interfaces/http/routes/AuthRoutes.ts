import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const authController = new AuthController();

const router = Router();

// Rutas públicas
router.post('/login', (req, res) => authController.login(req, res));

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticateToken, (req, res) => authController.me(req, res));

// Rutas de gestión de usuarios (solo ADMIN)
router.get('/users', authenticateToken, authorizeRole('ADMIN'), (req, res) => authController.listUsers(req, res));
router.post('/register', authenticateToken, authorizeRole('ADMIN'), (req, res) => authController.register(req, res));
router.put('/users/:id', authenticateToken, authorizeRole('ADMIN'), (req, res) => authController.updateUser(req, res));
router.delete('/users/:id', authenticateToken, authorizeRole('ADMIN'), (req, res) => authController.deleteUser(req, res));

export default router;
