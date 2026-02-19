import { Request, Response } from 'express';
import { CreateContract } from '../../../application/contracts/CreateContract';
import { AssignMachineToContract } from '../../../application/contracts/AssignMachineToContract';
import { CloseContract } from '../../../application/contracts/CloseContract';
import { ListContracts } from '../../../application/contracts/ListContracts';
import { PrismaContractRepository } from '../../../infrastructure/repositories/PrismaContractRepository';

const contractRepository = new PrismaContractRepository();

export class ContractsController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const createContract = new CreateContract(contractRepository);
      await createContract.execute(req.body);
      res.status(201).json({ message: 'Contract created successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async assignMachine(req: Request, res: Response): Promise<void> {
    try {
      const { contractId, machineId, hourlyRate } = req.body;
      const assignMachine = new AssignMachineToContract(contractRepository);
      await assignMachine.execute({ contractId, machineId, hourlyRate });
      res.status(200).json({ message: 'Machine assigned successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Contract not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }
  public async list(req: Request, res: Response): Promise<void> {
    try {
      const listContracts = new ListContracts(contractRepository);
      const contracts = await listContracts.execute();
      res.status(200).json(contracts);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async close(req: Request, res: Response): Promise<void> {
    try {
      const { contractId } = req.params;
      const closeContract = new CloseContract(contractRepository);
      await closeContract.execute(contractId);
      res.status(200).json({ message: 'Contract closed successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Contract not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }
}
