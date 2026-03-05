import { Router } from 'express';
import { OperatorController } from '../controllers/OperatorController';
import { PrismaOperatorRepository } from '../../../infrastructure/repositories/PrismaOperatorRepository';
import { authenticateToken } from '../middleware/auth';

const operatorRepository = new PrismaOperatorRepository();
const operatorController = new OperatorController();

const router = Router();

// Rutas públicas
router.get('/', (req, res) => operatorController.list(req, res));
router.get('/:id', (req, res) => operatorController.getById(req, res));

// Rutas protegidas
router.post('/', authenticateToken, (req, res) => operatorController.create(req, res));
router.put('/:id', authenticateToken, (req, res) => operatorController.update(req, res));
router.delete('/:id', authenticateToken, (req, res) => operatorController.delete(req, res));

// Asignación de operadores a máquinas
router.post('/assign', authenticateToken, (req, res) => operatorController.assignToMachine(req, res));
router.delete('/:machineId/unassign', authenticateToken, (req, res) => operatorController.unassignFromMachine(req, res));

// Historial de operadores por máquina
router.get('/machines/:machineId/history', (req, res) => operatorController.getMachineOperatorHistory(req, res));
router.get('/machines/:machineId/current', (req, res) => operatorController.getMachineOperator(req, res));
router.get('/:operatorId/machines', (req, res) => operatorController.getMachines(req, res));

export default router;
