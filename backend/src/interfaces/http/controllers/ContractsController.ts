import { Request, Response } from 'express';
import { CreateContract } from '../../../application/contracts/CreateContract';
import { UpdateContract } from '../../../application/contracts/UpdateContract';
import { AssignMachineToContract } from '../../../application/contracts/AssignMachineToContract';
import { CloseContract } from '../../../application/contracts/CloseContract';
import { ListContracts } from '../../../application/contracts/ListContracts';
import { PrismaContractRepository } from '../../../infrastructure/repositories/PrismaContractRepository';
import { prisma } from '../../../infrastructure/database/prisma';

const contractRepository = new PrismaContractRepository();

// Función helper para parsear fechas en hora local
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export class ContractsController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const { code, customer, startDate, endDate, value, monthlyValue, plazo, description } = req.body;
      
      const createContract = new CreateContract(contractRepository);
      await createContract.execute({
        code,
        customer,
        startDate: parseLocalDate(startDate),
        endDate: parseLocalDate(endDate),
        value: Number(value),
        monthlyValue: monthlyValue ? Number(monthlyValue) : undefined,
        plazo: plazo ? Number(plazo) : undefined,
        description: description || '',
      });
      res.status(201).json({ message: 'Contract created successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async assignMachine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { machineId } = req.body;
      const assignMachine = new AssignMachineToContract(contractRepository);
      await assignMachine.execute({ contractId: id, machineId });
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

  public async unassignMachine(req: Request, res: Response): Promise<void> {
    try {
      const { id, machineId } = req.params;
      
      // Delete the assignment
      await prisma.machineAssignment.deleteMany({
        where: {
          contractId: id,
          machineId: machineId,
        },
      });

      // Update machine status to AVAILABLE
      await prisma.machine.update({
        where: { id: machineId },
        data: { status: 'AVAILABLE' as any },
      });

      res.status(200).json({ message: 'Machine unassigned successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getMachines(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const assignments = await prisma.machineAssignment.findMany({
        where: { contractId: id },
        include: {
          machine: true,
        },
      });

      const machines = assignments.map(a => ({
        id: a.machine.id,
        code: a.machine.code,
        brand: a.machine.brand,
        model: a.machine.model,
        serialNumber: a.machine.serialNumber,
        status: a.machine.status,
        hourlyRate: a.hourlyRate,
        workedHours: a.workedHours,
        generatedIncome: a.generatedIncome,
        maintenanceCost: a.maintenanceCost,
        margin: a.margin,
      }));

      res.status(200).json(machines);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const listContracts = new ListContracts(contractRepository);
      const contracts = await listContracts.execute();
      
      const plainContracts = contracts.map((c) => ({
        id: c.id,
        code: c.code,
        customer: c.customer,
        startDate: c.startDate,
        endDate: c.endDate,
        value: c.value,
        monthlyValue: c.monthlyValue,
        plazo: c.plazo,
        status: c.status,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        machineCount: c.getAssignments().length,
      }));
      
      res.status(200).json(plainContracts);
    } catch (error) {
      console.error('Error listing contracts:', error);
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

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { code, customer, startDate, endDate, value, monthlyValue, plazo, status, description } = req.body;
      
      const updateContract = new UpdateContract(contractRepository);
      await updateContract.execute(id, {
        code,
        customer,
        startDate: parseLocalDate(startDate),
        endDate: parseLocalDate(endDate),
        value: Number(value),
        monthlyValue: monthlyValue ? Number(monthlyValue) : undefined,
        plazo: plazo ? Number(plazo) : undefined,
        status,
        description: description || '',
      });
      res.status(200).json({ message: 'Contract updated successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.contract.delete({
        where: { id },
      });
      
      res.status(200).json({ message: 'Contract deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
