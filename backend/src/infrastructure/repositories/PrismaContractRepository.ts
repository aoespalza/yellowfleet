import { IContractRepository } from '../../application/contracts/IContractRepository';
import { Contract } from '../../domain/contracts/Contract';
import { ContractStatus } from '../../domain/contracts/ContractStatus';
import { MachineAssignment } from '../../domain/contracts/MachineAssignment';
import { MachineAssignmentProps } from '../../domain/contracts/MachineAssignmentProps';
import prisma from '../prisma/prismaClient';

export class PrismaContractRepository implements IContractRepository {
  async save(contract: Contract): Promise<void> {
    const isNew = !contract.id;
    
    await prisma.contract.upsert({
      where: { id: contract.id || 'new' },
      create: {
        id: contract.id,
        code: contract.code,
        customer: contract.customer,
        startDate: contract.startDate,
        endDate: contract.endDate,
        value: contract.value,
        monthlyValue: contract.monthlyValue as any,
        plazo: contract.plazo as any,
        status: contract.status as any,
        description: contract.description,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      },
      update: {
        code: contract.code,
        customer: contract.customer,
        startDate: contract.startDate,
        endDate: contract.endDate,
        value: contract.value,
        monthlyValue: contract.monthlyValue as any,
        plazo: contract.plazo as any,
        status: contract.status as any,
        description: contract.description,
        updatedAt: contract.updatedAt,
      },
    });

    const assignments = contract.getAssignments();
    // Solo crear nuevas asignaciones (no borrar las existentes)
    if (assignments.length > 0) {
      // Obtener IDs de asignaciones existentes
      const existingAssignments = await prisma.machineAssignment.findMany({
        where: { contractId: contract.id },
        select: { id: true },
      });
      const existingIds = new Set(existingAssignments.map(a => a.id));

      // Filtrar solo las asignaciones nuevas
      const newAssignments = assignments.filter(a => !existingIds.has(a.id!));
      
      if (newAssignments.length > 0) {
        await prisma.machineAssignment.createMany({
          data: newAssignments.map((assignment) => ({
            id: assignment.id!,
            contractId: contract.id!,
            machineId: assignment.machineId,
            hourlyRate: assignment.hourlyRate,
            workedHours: assignment.workedHours,
            maintenanceCost: assignment.maintenanceCost,
            generatedIncome: assignment.generatedIncome,
            margin: assignment.margin,
            createdAt: assignment.createdAt!,
            updatedAt: assignment.updatedAt!,
          })) as any,
        });
      }
    }
  }

  async findById(id: string): Promise<Contract | null> {
    const prismaContract = await prisma.contract.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!prismaContract) {
      return null;
    }

    const contract = Contract.fromDatabase({
      id: prismaContract.id,
      code: prismaContract.code,
      customer: prismaContract.customer,
      startDate: prismaContract.startDate,
      endDate: prismaContract.endDate,
      value: prismaContract.value,
      monthlyValue: (prismaContract as any).monthlyValue ?? undefined,
      plazo: (prismaContract as any).plazo ?? undefined,
      status: this.mapPrismaStatusToDomain(prismaContract.status),
      description: prismaContract.description ?? undefined,
      createdAt: prismaContract.createdAt,
      updatedAt: prismaContract.updatedAt,
    });

    // Verificar si el contrato está vencido y cambiar estado a COMPLETED
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDate = new Date(prismaContract.endDate);
    endDate.setHours(0, 0, 0, 0);
    const statusStr = String(contract.status);
    
    // La liberación de máquinas se hace en PrismaMachineRepository.findAll()
    
    let isExpired = false;
    if (endDate < now && statusStr === 'ACTIVE') {
      isExpired = true;
      console.log('>>> Expirando contrato:', prismaContract.code);
      // Liberar máquinas asignadas
      const machineIds = prismaContract.assignments.map(a => a.machineId);
      if (machineIds.length > 0) {
        await prisma.machine.updateMany({
          where: { id: { in: machineIds } },
          data: { status: 'AVAILABLE' as any },
        });
      }
      // Marcar contrato como completado
      await prisma.contract.update({
        where: { id: prismaContract.id },
        data: { status: 'COMPLETED' as any },
      });
    }

    // Si expiró, cambiar temporalmente el status para poder cargar asignaciones
    if (isExpired) {
      (contract as any).props.status = 'COMPLETED';
    }

    for (const assignment of prismaContract.assignments) {
      const machineAssignment = MachineAssignment.fromDatabase({
        id: assignment.id,
        contractId: assignment.contractId,
        machineId: assignment.machineId,
        hourlyRate: (assignment as any).hourlyRate ?? 0,
        workedHours: assignment.workedHours,
        maintenanceCost: assignment.maintenanceCost,
        generatedIncome: assignment.generatedIncome,
        margin: assignment.margin,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      });
      contract.addMachineAssignmentFromDb(machineAssignment);
    }

    return contract;
  }

  async findAll(): Promise<Contract[]> {
    const prismaContracts = await prisma.contract.findMany({
      include: { assignments: true },
    });

    // Marcar contratos expirados (la liberación de máquinas se hace en PrismaMachineRepository)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    for (const prismaContract of prismaContracts) {
      const endDate = new Date(prismaContract.endDate);
      endDate.setHours(0, 0, 0, 0);
      const statusStr = String(prismaContract.status);
      
      if (endDate < now && statusStr === 'ACTIVE') {
        console.log('>>> Expirando contrato:', prismaContract.code);
        // Liberar máquinas asignadas
        const machineIds = prismaContract.assignments.map(a => a.machineId);
        if (machineIds.length > 0) {
          await prisma.machine.updateMany({
            where: { id: { in: machineIds } },
            data: { status: 'AVAILABLE' as any },
          });
        }
        // Marcar contrato como completado
        await prisma.contract.update({
          where: { id: prismaContract.id },
          data: { status: 'COMPLETED' as any },
        });
      }
    }

    // Recargar contratos después de actualizar
    const updatedContracts = await prisma.contract.findMany({
      include: { assignments: true },
    });

    return updatedContracts.map((prismaContract) => {
      const contract = Contract.fromDatabase({
        id: prismaContract.id,
        code: prismaContract.code,
        customer: prismaContract.customer,
        startDate: prismaContract.startDate,
        endDate: prismaContract.endDate,
        value: prismaContract.value,
        monthlyValue: (prismaContract as any).monthlyValue ?? undefined,
        plazo: (prismaContract as any).plazo ?? undefined,
        status: this.mapPrismaStatusToDomain(prismaContract.status),
        description: prismaContract.description ?? undefined,
        createdAt: prismaContract.createdAt,
        updatedAt: prismaContract.updatedAt,
      });

      for (const assignment of prismaContract.assignments) {
        const machineAssignment = MachineAssignment.fromDatabase({
          id: assignment.id,
          contractId: assignment.contractId,
          machineId: assignment.machineId,
          hourlyRate: (assignment as any).hourlyRate ?? 0,
          workedHours: assignment.workedHours,
          maintenanceCost: assignment.maintenanceCost,
          generatedIncome: assignment.generatedIncome,
          margin: assignment.margin,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
        });
        contract.addMachineAssignmentFromDb(machineAssignment);
      }

      return contract;
    });
  }

  private mapPrismaStatusToDomain(
    prismaStatus: import('@prisma/client').ContractStatus
  ): ContractStatus {
    return ContractStatus[prismaStatus as keyof typeof ContractStatus];
  }
}
