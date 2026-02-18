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

router.post('/contracts', (req, res) => contractsController.create(req, res));
router.post('/contracts/:id/assign', (req, res) => contractsController.assignMachine(req, res));
router.patch('/contracts/:id/close', (req, res) => contractsController.close(req, res));

export default router;
