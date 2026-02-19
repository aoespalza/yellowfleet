import { Request, Response } from 'express';
import { CreateMachine } from '../../../application/fleet/CreateMachine';
import { ChangeMachineStatus } from '../../../application/fleet/ChangeMachineStatus';
import { GetMachineById } from '../../../application/fleet/GetMachineById';
import { ListMachines } from '../../../application/fleet/ListMachines';
import { PrismaMachineRepository } from '../../../infrastructure/repositories/PrismaMachineRepository';
import { MachineStatus } from '../../../domain/fleet/MachineStatus';
import { UpdateMachine } from '../../../application/fleet/UpdateMachine';


const machineRepository = new PrismaMachineRepository();

export class FleetController {
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const createMachine = new CreateMachine(machineRepository);
      await createMachine.execute(req.body);
      res.status(201).json({ message: 'Machine created successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async changeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { machineId, newStatus } = req.body;
      const changeMachineStatus = new ChangeMachineStatus(machineRepository);
      await changeMachineStatus.execute({
        machineId,
        newStatus: newStatus as MachineStatus,
      });
      res.status(200).json({ message: 'Machine status changed successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Machine not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const getMachineById = new GetMachineById(machineRepository);
      const machine = await getMachineById.execute(id);
      res.status(200).json(machine);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'Machine not found') {
        res.status(404).json({ error: message });
      } else {
        res.status(400).json({ error: message });
      }
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const listMachines = new ListMachines(machineRepository);
      const machines = await listMachines.execute();
  
      const response = machines.map((machine) => ({
        id: machine.id,
        code: machine.code,
        type: machine.type,
        brand: machine.brand,
        model: machine.model,
        year: machine.year,
        serialNumber: machine.serialNumber,
        hourMeter: machine.hourMeter,
        acquisitionDate: machine.acquisitionDate,
        acquisitionValue: machine.acquisitionValue,
        usefulLifeHours: machine.usefulLifeHours,
        status: machine.status,
        currentLocation: machine.currentLocation,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
      }));
  
      res.status(200).json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const updateMachine = new UpdateMachine(machineRepository);
  
      await updateMachine.execute({
        id: req.params.id,
        ...req.body,
        acquisitionDate: new Date(req.body.acquisitionDate),
      });
  
      res.status(200).json({ message: 'Machine updated successfully' });
    } catch (error) {
      console.error('UPDATE ERROR FULL:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
  
  
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      await machineRepository.delete(req.params.id);
      res.status(200).json({ message: 'Machine deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const prisma = await import('@prisma/client');
      const { PrismaClient } = prisma;
      const client = new PrismaClient();

      // Get machine data
      const machine = await client.machine.findUnique({
        where: { id },
      });

      if (!machine) {
        res.status(404).json({ error: 'Machine not found' });
        return;
      }

      // Get current contract assignment (IN_CONTRACT status)
      const currentAssignment = await client.machineAssignment.findFirst({
        where: {
          machineId: id,
          contract: {
            status: 'ACTIVE',
          },
        },
        include: {
          contract: true,
        },
      });

      // Get all assignments (historical)
      const allAssignments = await client.machineAssignment.findMany({
        where: { machineId: id },
        include: {
          contract: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Get work orders
      const workOrders = await client.workOrder.findMany({
        where: { machineId: id },
        orderBy: { entryDate: 'desc' },
      });

      // Calculate profitability by contract
      const contractsProfitability = allAssignments.map((assignment) => ({
        contractId: assignment.contractId,
        contractCode: assignment.contract.code,
        customer: assignment.contract.customer,
        startDate: assignment.contract.startDate,
        endDate: assignment.contract.endDate,
        status: assignment.contract.status,
        hourlyRate: assignment.hourlyRate,
        workedHours: assignment.workedHours,
        generatedIncome: assignment.generatedIncome,
        maintenanceCost: assignment.maintenanceCost,
        margin: assignment.margin,
      }));

      // Total profitability
      const totalIncome = allAssignments.reduce((sum, a) => sum + a.generatedIncome, 0);
      const totalMaintenance = allAssignments.reduce((sum, a) => sum + a.maintenanceCost, 0);
      const totalMargin = allAssignments.reduce((sum, a) => sum + a.margin, 0);
      const totalWorkedHours = allAssignments.reduce((sum, a) => sum + a.workedHours, 0);

      // Workshop stats
      const totalWorkshopVisits = workOrders.length;
      const totalSparePartsCost = workOrders.reduce((sum, w) => sum + w.sparePartsCost, 0);
      const totalLaborCost = workOrders.reduce((sum, w) => sum + w.laborCost, 0);
      const totalWorkshopCost = workOrders.reduce((sum, w) => sum + w.totalCost, 0);
      const totalDowntimeHours = workOrders.reduce((sum, w) => sum + (w.downtimeHours || 0), 0);

      const response = {
        // Machine details
        id: machine.id,
        code: machine.code,
        type: machine.type,
        brand: machine.brand,
        model: machine.model,
        year: machine.year,
        serialNumber: machine.serialNumber,
        hourMeter: machine.hourMeter,
        acquisitionDate: machine.acquisitionDate,
        acquisitionValue: machine.acquisitionValue,
        usefulLifeHours: machine.usefulLifeHours,
        status: machine.status,
        currentLocation: machine.currentLocation,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,

        // Current contract
        currentContract: currentAssignment
          ? {
              id: currentAssignment.contract.id,
              code: currentAssignment.contract.code,
              customer: currentAssignment.contract.customer,
              startDate: currentAssignment.contract.startDate,
              endDate: currentAssignment.contract.endDate,
              hourlyRate: currentAssignment.hourlyRate,
            }
          : null,

        // Historical contracts
        contracts: contractsProfitability,

        // Profitability summary
        profitability: {
          totalWorkedHours,
          totalIncome,
          totalMaintenanceCost: totalMaintenance,
          totalMargin,
        },

        // Work orders
        workOrders: workOrders.map((wo) => ({
          id: wo.id,
          type: wo.type,
          status: wo.status,
          entryDate: wo.entryDate,
          exitDate: wo.exitDate,
          sparePartsCost: wo.sparePartsCost,
          laborCost: wo.laborCost,
          totalCost: wo.totalCost,
          downtimeHours: wo.downtimeHours,
        })),

        // Workshop summary
        workshopSummary: {
          totalVisits: totalWorkshopVisits,
          totalSparePartsCost,
          totalLaborCost,
          totalCost: totalWorkshopCost,
          totalDowntimeHours,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching machine details:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
