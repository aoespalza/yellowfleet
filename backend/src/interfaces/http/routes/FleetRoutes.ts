import { Router } from 'express';
import { FleetController } from '../controllers/FleetController';
import { CreateMachine } from '../../../application/fleet/CreateMachine';
import { ChangeMachineStatus } from '../../../application/fleet/ChangeMachineStatus';
import { GetMachineById } from '../../../application/fleet/GetMachineById';
import { ListMachines } from '../../../application/fleet/ListMachines';
import { PrismaMachineRepository } from '../../../infrastructure/repositories/PrismaMachineRepository';
import { authenticateToken, authorizeRole } from '../middleware/auth';


const machineRepository = new PrismaMachineRepository();

const createMachine = new CreateMachine(machineRepository);
const changeMachineStatus = new ChangeMachineStatus(machineRepository);
const getMachineById = new GetMachineById(machineRepository);
const listMachines = new ListMachines(machineRepository);

const fleetController = new FleetController();

const router = Router();

// Rutas públicas (solo lectura)
router.get('/machines', (req, res) => fleetController.list(req, res));
router.get('/machines/:id', (req, res) => fleetController.getById(req, res));
router.get('/machines/:id/details', (req, res) => fleetController.getDetails(req, res));

// Rutas protegidas (requieren autenticación y rol ADMIN o MANAGER)
router.post('/machines', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => fleetController.create(req, res));
router.patch('/machines/:id/status', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => fleetController.changeStatus(req, res));
router.put('/machines/:id', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => fleetController.update(req, res));
router.delete('/machines/:id', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => fleetController.delete(req, res));
  
export default router;
