import { Request, Response } from 'express';
import { CreateOperator, ListOperators, GetOperatorById, UpdateOperator, DeleteOperator, AssignOperatorToMachine, UnassignOperatorFromMachine, GetOperatorMachines, GetMachineCurrentOperator, GetMachineOperatorHistory } from '../../../application/operator';
import { PrismaOperatorRepository } from '../../../infrastructure/repositories/PrismaOperatorRepository';

const operatorRepository = new PrismaOperatorRepository();

export class OperatorController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const createOperator = new CreateOperator(operatorRepository);
      const operator = await createOperator.execute(req.body);
      res.status(201).json(operator.toPlainObject());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const listOperators = new ListOperators(operatorRepository);
      const operators = await listOperators.execute(activeOnly);
      res.status(200).json(operators.map(o => o.toPlainObject()));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const getOperatorById = new GetOperatorById(operatorRepository);
      const operator = await getOperatorById.execute(id);
      res.status(200).json(operator.toPlainObject());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Operator not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateOperator = new UpdateOperator(operatorRepository);
      const operator = await updateOperator.execute(id, req.body);
      res.status(200).json(operator.toPlainObject());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Operator not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleteOperator = new DeleteOperator(operatorRepository);
      await deleteOperator.execute(id);
      res.status(200).json({ message: 'Operator deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Operator not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }

  public async assignToMachine(req: Request, res: Response): Promise<void> {
    try {
      const { operatorId, machineId } = req.body;
      const assignOperator = new AssignOperatorToMachine(operatorRepository);
      await assignOperator.execute(operatorId, machineId);
      res.status(200).json({ message: 'Operator assigned to machine successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async unassignFromMachine(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const unassignOperator = new UnassignOperatorFromMachine(operatorRepository);
      await unassignOperator.execute(machineId);
      res.status(200).json({ message: 'Operator unassigned from machine successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getMachines(req: Request, res: Response): Promise<void> {
    try {
      const { operatorId } = req.params;
      const getMachines = new GetOperatorMachines(operatorRepository);
      const machines = await getMachines.execute(operatorId);
      res.status(200).json(machines);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getMachineOperator(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const getOperator = new GetMachineCurrentOperator(operatorRepository);
      const operator = await getOperator.execute(machineId);
      res.status(200).json(operator ? operator.toPlainObject() : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getMachineOperatorHistory(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const getHistory = new GetMachineOperatorHistory(operatorRepository);
      const history = await getHistory.execute(machineId);
      res.status(200).json(history);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
