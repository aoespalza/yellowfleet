import { Request, Response } from 'express';
import { CreateMachine } from '../../../application/fleet/CreateMachine';
import { ChangeMachineStatus } from '../../../application/fleet/ChangeMachineStatus';
import { GetMachineById } from '../../../application/fleet/GetMachineById';
import { ListMachines } from '../../../application/fleet/ListMachines';
import { PrismaMachineRepository } from '../../../infrastructure/repositories/PrismaMachineRepository';
import { MachineStatus } from '../../../domain/fleet/MachineStatus';
import { UpdateMachine } from '../../../application/fleet/UpdateMachine';
import prisma from '../../../infrastructure/prisma/prismaClient';


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

  public async updateHourMeter(req: Request, res: Response): Promise<void> {
    try {
      const { hourMeter } = req.body;
      const userId = (req as any).userId;
      
      if (hourMeter === undefined || typeof hourMeter !== 'number') {
        res.status(400).json({ error: 'hourMeter es requerido y debe ser un número' });
        return;
      }

      const machine = await machineRepository.findById(req.params.id);
      if (!machine) {
        res.status(404).json({ error: 'Máquina no encontrada' });
        return;
      }

      const previousValue = machine.hourMeter || 0;
      
      await machineRepository.update(req.params.id, { hourMeter });

      // Guardar trazabilidad del horómetro
      await prisma.hourMeterLog.create({
        data: {
          machineId: req.params.id,
          userId: userId,
          previousValue: previousValue,
          newValue: hourMeter,
        }
      });

      res.status(200).json({ 
        message: 'Horómetro actualizado',
        hourMeter: hourMeter 
      });
    } catch (error) {
      console.error('Update hourMeter error:', error);
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

      // Total maintenance cost including workshop costs
      const totalMaintenanceCost = totalMaintenance + totalWorkshopCost;

      // Total margin including workshop costs
      const totalMarginWithWorkshop = totalIncome - totalMaintenanceCost;

      const response = {
        // Machine details
        id: machine.id,
        code: machine.code,
        type: machine.type,
        brand: machine.brand,
        model: machine.model,
        imageUrl: machine.imageUrl,
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
          totalMaintenanceCost,
          totalMargin: totalMarginWithWorkshop,
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

  public async getDetailsPublic(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const prisma = await import('@prisma/client');
      const { PrismaClient } = prisma;
      const client = new PrismaClient();

      // Get machine data (only public fields)
      const machine = await client.machine.findUnique({
        where: { id },
      });

      if (!machine) {
        res.status(404).json({ error: 'Machine not found' });
        return;
      }

      // Get work orders (only basic info)
      const workOrders = await client.workOrder.findMany({
        where: { machineId: id },
        orderBy: { entryDate: 'desc' },
        select: {
          id: true,
          type: true,
          status: true,
          entryDate: true,
          exitDate: true,
          sparePartsCost: true,
          laborCost: true,
          totalCost: true,
          downtimeHours: true,
        },
      });

      // Get assignments with contract info
      const assignments = await client.machineAssignment.findMany({
        where: { machineId: id },
        include: { contract: true },
        orderBy: { createdAt: 'asc' },
      });

      // Calculate stats
      const totalWorkedHours = assignments.reduce((sum, a) => sum + a.workedHours, 0);
      const totalIncome = assignments.reduce((sum, a) => sum + a.generatedIncome, 0);
      const totalMaintenance = assignments.reduce((sum, a) => sum + a.maintenanceCost, 0);
      const totalWorkshopVisits = workOrders.length;
      const totalSparePartsCost = workOrders.reduce((sum, w) => sum + w.sparePartsCost, 0);
      const totalLaborCost = workOrders.reduce((sum, w) => sum + w.laborCost, 0);
      const totalWorkshopCost = workOrders.reduce((sum, w) => sum + w.totalCost, 0);
      const totalDowntimeHours = workOrders.reduce((sum, w) => sum + (w.downtimeHours || 0), 0);

      // Contracts summary
      const contracts = assignments.map((a) => ({
        contractId: a.contractId,
        contractCode: a.contract.code,
        customer: a.contract.customer,
        startDate: a.contract.startDate,
        endDate: a.contract.endDate,
        status: a.contract.status,
        workedHours: a.workedHours,
        generatedIncome: a.generatedIncome,
        maintenanceCost: a.maintenanceCost,
        margin: a.margin,
      }));

      const response = {
        id: machine.id,
        code: machine.code,
        type: machine.type,
        brand: machine.brand,
        model: machine.model,
        imageUrl: machine.imageUrl,
        year: machine.year,
        serialNumber: machine.serialNumber,
        hourMeter: machine.hourMeter,
        usefulLifeHours: machine.usefulLifeHours,
        acquisitionValue: machine.acquisitionValue,
        status: machine.status,
        currentLocation: machine.currentLocation,
        
        // Ultimo mantenimiento
        lastMaintenance: workOrders.length > 0 ? {
          date: workOrders[workOrders.length - 1].entryDate,
          type: workOrders[workOrders.length - 1].type,
          hourMeter: (machine.hourMeter || 0) - workOrders.reduce((sum, wo) => sum + (wo.downtimeHours || 0), 0),
          cost: workOrders[workOrders.length - 1].totalCost,
        } : null,
        
        contracts,
        workOrders,
        
        profitability: {
          totalWorkedHours,
          totalIncome,
          totalMaintenanceCost: totalMaintenance + totalWorkshopCost,
          totalMargin: totalIncome - (totalMaintenance + totalWorkshopCost),
        },
        
        workshopSummary: {
          totalVisits: totalWorkshopVisits,
          totalSparePartsCost,
          totalLaborCost,
          totalDowntimeHours,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching public machine details:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getHourMeterHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const logs = await prisma.hourMeterLog.findMany({
        where: { machineId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { username: true }
          }
        }
      });

      res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching hour meter history:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getLegalDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      
      const documents = await prisma.legalDocument.findMany({
        where: { machineId },
      });

      // Return as object with keys for each document type
      const result = {
        POLIZA: documents.find(d => d.type === 'POLIZA') || null,
        SOAT: documents.find(d => d.type === 'SOAT') || null,
        TECNICO_MECANICA: documents.find(d => d.type === 'TECNICO_MECANICA') || null,
      };

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching legal documents:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async updateLegalDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { machineId } = req.params;
      const { POLIZA, SOAT, TECNICO_MECANICA } = req.body;

      const documentsToUpsert = [
        { type: 'POLIZA', data: POLIZA },
        { type: 'SOAT', data: SOAT },
        { type: 'TECNICO_MECANICA', data: TECNICO_MECANICA },
      ];

      const results = await Promise.all(
        documentsToUpsert.map(async ({ type, data }) => {
          // Si no se proporciona datos, buscar el documento existente
          if (!data) {
            return prisma.legalDocument.findUnique({
              where: {
                machineId_type: {
                  machineId,
                  type: type as any,
                },
              },
            });
          }

          // Upsert con los datos proporcionados
          return prisma.legalDocument.upsert({
            where: {
              machineId_type: {
                machineId,
                type: type as any,
              },
            },
            update: {
              insuranceName: data.insuranceName || null,
              policyNumber: data.policyNumber || null,
              expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
            },
            create: {
              machineId,
              type: type as any,
              insuranceName: data.insuranceName || null,
              policyNumber: data.policyNumber || null,
              expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
            },
          });
        })
      );

      const result = {
        POLIZA: results[0],
        SOAT: results[1],
        TECNICO_MECANICA: results[2],
      };

      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating legal documents:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }

  public async getExpiringDocuments(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      const documents = await prisma.legalDocument.findMany({
        where: {
          expirationDate: {
            gte: now,
            lte: futureDate,
          },
        },
        include: {
          machine: {
            select: {
              code: true,
              brand: true,
              model: true,
            },
          },
        },
        orderBy: {
          expirationDate: 'asc',
        },
      });

      const result = documents.map(doc => {
        const expDate = new Date(doc.expirationDate!);
        const daysRemaining = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let urgency: 'critical' | 'warning' | 'normal';
        if (daysRemaining <= 7) urgency = 'critical';
        else if (daysRemaining <= 15) urgency = 'warning';
        else urgency = 'normal';

        return {
          id: doc.id,
          machineId: doc.machineId,
          machineCode: doc.machine.code,
          machineName: `${doc.machine.brand} ${doc.machine.model}`,
          documentType: doc.type,
          documentName: doc.type === 'POLIZA' ? 'Póliza de Seguro' : 
                        doc.type === 'SOAT' ? 'SOAT' : 'Revisión Técnico-Mecánica',
          expirationDate: doc.expirationDate,
          daysRemaining,
          urgency,
        };
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  }
}
