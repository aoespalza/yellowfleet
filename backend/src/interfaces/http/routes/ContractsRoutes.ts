import { Router } from 'express';
import { ContractsController } from '../controllers/ContractsController';
import { CreateContract } from '../../../application/contracts/CreateContract';
import { AssignMachineToContract } from '../../../application/contracts/AssignMachineToContract';
import { CloseContract } from '../../../application/contracts/CloseContract';
import { PrismaContractRepository } from '../../../infrastructure/repositories/PrismaContractRepository';

const contractRepository = new PrismaContractRepository();

const createContract = new CreateContract(contractRepository);
const assignMachineToContract = new AssignMachineToContract(contractRepository);
const closeContract = new CloseContract(contractRepository);

const contractsController = new ContractsController();

const router = Router();

router.get('/', (req, res) => contractsController.list(req, res));
router.post('/', (req, res) => contractsController.create(req, res));
router.post('/:id/assign', (req, res) => contractsController.assignMachine(req, res));
router.patch('/:id/close', (req, res) => contractsController.close(req, res));
router.delete('/:id', (req, res) => contractsController.delete(req, res));

export default router;
