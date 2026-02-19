import { Router } from 'express';
import { FleetController } from '../controllers/FleetController';
import { CreateMachine } from '../../../application/fleet/CreateMachine';
import { ChangeMachineStatus } from '../../../application/fleet/ChangeMachineStatus';
import { GetMachineById } from '../../../application/fleet/GetMachineById';
import { ListMachines } from '../../../application/fleet/ListMachines';
import { PrismaMachineRepository } from '../../../infrastructure/repositories/PrismaMachineRepository';


const machineRepository = new PrismaMachineRepository();

const createMachine = new CreateMachine(machineRepository);
const changeMachineStatus = new ChangeMachineStatus(machineRepository);
const getMachineById = new GetMachineById(machineRepository);
const listMachines = new ListMachines(machineRepository);

const fleetController = new FleetController();

const router = Router();

router.post('/machines', (req, res) => fleetController.create(req, res));
router.patch('/machines/:id/status', (req, res) => fleetController.changeStatus(req, res));
router.get('/machines/:id', (req, res) => fleetController.getById(req, res));
router.get('/machines/:id/details', (req, res) => fleetController.getDetails(req, res));
router.get('/machines', (req, res) => fleetController.list(req, res));
router.put('/machines/:id', (req, res) => fleetController.update(req, res));
router.delete('/machines/:id', (req, res) => fleetController.delete(req, res));
  

export default router;
