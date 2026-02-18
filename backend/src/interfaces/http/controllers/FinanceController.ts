import { Request, Response } from 'express';
import { FinanceService } from '../../../application/finance/FinanceService';
import { PrismaContractRepository } from '../../../infrastructure/repositories/PrismaContractRepository';
import { PrismaMachineRepository } from '../../../infrastructure/repositories/PrismaMachineRepository';
import { PrismaWorkOrderRepository } from '../../../infrastructure/repositories/PrismaWorkOrderRepository';

const contractRepository = new PrismaContractRepository();
const machineRepository = new PrismaMachineRepository();
const workOrderRepository = new PrismaWorkOrderRepository();

const financeService = new FinanceService(contractRepository, machineRepository, workOrderRepository);

export class FinanceController {
  public async machineProfitability(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const result = await financeService.calculateMachineProfitability(machineId);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async contractMargin(req: Request, res: Response): Promise<void> {
    try {
      const { contractId } = req.params;
      const result = await financeService.calculateContractMargin(contractId);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Contract not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }

  public async fleetAvailability(req: Request, res: Response): Promise<void> {
    try {
      const result = await financeService.calculateFleetAvailability();
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
