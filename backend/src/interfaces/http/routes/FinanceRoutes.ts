import { Router } from 'express';
import { FinanceController } from '../controllers/FinanceController';
import { FinanceService } from '../../../application/finance/FinanceService';
import { PrismaContractRepository } from '../../../infrastructure/repositories/PrismaContractRepository';
import { PrismaMachineRepository } from '../../../infrastructure/repositories/PrismaMachineRepository';
import { PrismaWorkOrderRepository } from '../../../infrastructure/repositories/PrismaWorkOrderRepository';

const contractRepository = new PrismaContractRepository();
const machineRepository = new PrismaMachineRepository();
const workOrderRepository = new PrismaWorkOrderRepository();

const financeService = new FinanceService(contractRepository, machineRepository, workOrderRepository);
const financeController = new FinanceController();

const router = Router();

router.get('/finance/machine/:id', (req, res) => financeController.machineProfitability(req, res));
router.get('/finance/contract/:id', (req, res) => financeController.contractMargin(req, res));
router.get('/finance/fleet/availability', (req, res) => financeController.fleetAvailability(req, res));

export default router;
