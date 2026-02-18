import { Request, Response } from 'express';
import { CreateMachine } from '../../../application/fleet/CreateMachine';
import { ChangeMachineStatus } from '../../../application/fleet/ChangeMachineStatus';
import { GetMachineById } from '../../../application/fleet/GetMachineById';
import { ListMachines } from '../../../application/fleet/ListMachines';
import { PrismaMachineRepository } from '../../../infrastructure/repositories/PrismaMachineRepository';
import { MachineStatus } from '../../../domain/fleet/MachineStatus';

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
  
}
