import { Router } from 'express';
import { ContractsController } from '../controllers/ContractsController';
import { CreateContract } from '../../../application/contracts/CreateContract';
import { AssignMachineToContract } from '../../../application/contracts/AssignMachineToContract';
import { CloseContract } from '../../../application/contracts/CloseContract';
import { PrismaContractRepository } from '../../../infrastructure/repositories/PrismaContractRepository';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const contractRepository = new PrismaContractRepository();

const createContract = new CreateContract(contractRepository);
const assignMachineToContract = new AssignMachineToContract(contractRepository);
const closeContract = new CloseContract(contractRepository);

const contractsController = new ContractsController();

const router = Router();

// Rutas públicas (solo lectura)
router.get('/', (req, res) => contractsController.list(req, res));

// Rutas protegidas (requieren autenticación y rol ADMIN o MANAGER)
router.post('/', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => contractsController.create(req, res));
router.put('/:id', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => contractsController.update(req, res));
router.post('/:id/assign', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => contractsController.assignMachine(req, res));
router.get('/:id/machines', (req, res) => contractsController.getMachines(req, res));
router.delete('/:id/assign/:machineId', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => contractsController.unassignMachine(req, res));
router.patch('/:id/close', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => contractsController.close(req, res));
router.delete('/:id', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => contractsController.delete(req, res));

export default router;
