import { Request, Response } from 'express';
import { FinanceService, FinanceDashboardResult, MachineProfitabilityResult, MachineUptimeResult, WorkshopImpactResult, LeasingFormData, LeasingPaymentFormData } from '../../../application/finance/FinanceService';
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

  public async dashboard(req: Request, res: Response): Promise<void> {
    try {
      const result = await financeService.getDashboardMetrics();
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async machinesProfitability(req: Request, res: Response): Promise<void> {
    try {
      const result = await financeService.getMachinesProfitability();
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async machineUptime(req: Request, res: Response): Promise<void> {
    try {
      const result = await financeService.getMachineUptime();
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async workshopImpact(req: Request, res: Response): Promise<void> {
    try {
      const result = await financeService.getWorkshopImpact();
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // Leasing endpoints
  public async getAllLeasings(req: Request, res: Response): Promise<void> {
    try {
      console.log('[Finance] getAllLeasings called');
      const result = await financeService.getAllLeasings();
      res.status(200).json(result);
    } catch (error) {
      console.error('[Finance] getAllLeasings error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getLeasingByMachine(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const result = await financeService.getLeasingByMachine(machineId);
      if (!result) {
        res.status(404).json({ error: 'Leasing not found' });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async createLeasing(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as LeasingFormData;
      const result = await financeService.createLeasing(data);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async updateLeasing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as Partial<LeasingFormData>;
      const result = await financeService.updateLeasing(id, data);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async deleteLeasing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await financeService.deleteLeasing(id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getLeasingSummary(req: Request, res: Response): Promise<void> {
    try {
      console.log('[Finance] getLeasingSummary called');
      const result = await financeService.getLeasingSummary();
      res.status(200).json(result);
    } catch (error) {
      console.error('[Finance] getLeasingSummary error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getMachinesWithoutLeasing(req: Request, res: Response): Promise<void> {
    try {
      console.log('[Finance] getMachinesWithoutLeasing called');
      const result = await financeService.getMachinesWithoutLeasing();
      res.status(200).json(result);
    } catch (error) {
      console.error('[Finance] getMachinesWithoutLeasing error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  // Payment endpoints
  public async getPaymentsByLeasing(req: Request, res: Response): Promise<void> {
    try {
      const { leasingId } = req.params;
      const result = await financeService.getPaymentsByLeasing(leasingId);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as LeasingPaymentFormData;
      const result = await financeService.createPayment(data);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async deletePayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await financeService.deletePayment(id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
