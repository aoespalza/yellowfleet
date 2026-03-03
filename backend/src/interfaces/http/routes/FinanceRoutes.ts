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

// existing endpoints
router.get('/machine/:id', (req, res) => financeController.machineProfitability(req, res));
router.get('/contract/:id', (req, res) => financeController.contractMargin(req, res));
router.get('/fleet/availability', (req, res) => financeController.fleetAvailability(req, res));

// financial dashboard endpoints
router.get('/dashboard', (req, res) => financeController.dashboard(req, res));
router.get('/machines/profitability', (req, res) => financeController.machinesProfitability(req, res));
router.get('/machines/uptime', (req, res) => financeController.machineUptime(req, res));
router.get('/workshop/impact', (req, res) => financeController.workshopImpact(req, res));

// leasing endpoints
router.get('/leasing', (req, res) => financeController.getAllLeasings(req, res));
router.get('/leasing/summary', (req, res) => financeController.getLeasingSummary(req, res));
router.get('/leasing/machines-available', (req, res) => financeController.getMachinesWithoutLeasing(req, res));
router.get('/leasing/machine/:machineId', (req, res) => financeController.getLeasingByMachine(req, res));
router.post('/leasing', (req, res) => financeController.createLeasing(req, res));
router.put('/leasing/:id', (req, res) => financeController.updateLeasing(req, res));
router.delete('/leasing/:id', (req, res) => financeController.deleteLeasing(req, res));

// leasing payment endpoints
router.get('/leasing/:leasingId/payments', (req, res) => financeController.getPaymentsByLeasing(req, res));
router.post('/leasing/payments', (req, res) => financeController.createPayment(req, res));
router.delete('/leasing/payments/:id', (req, res) => financeController.deletePayment(req, res));

export default router;
