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
        status: contract.status as unknown as import('@prisma/client').ContractStatus,
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
        status: contract.status as unknown as import('@prisma/client').ContractStatus,
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
          })),
        });
      }
    }
  }

  async findById(id: string): Promise<Contract | null> {
    console.log('findById called with id:', id);
    
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
        hourlyRate: assignment.hourlyRate,
        workedHours: assignment.workedHours,
        maintenanceCost: assignment.maintenanceCost,
        generatedIncome: assignment.generatedIncome,
        margin: assignment.margin,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      });
      contract.addMachineAssignment(machineAssignment);
    }

    return contract;
  }

  async findAll(): Promise<Contract[]> {
    const prismaContracts = await prisma.contract.findMany({
      include: { assignments: true },
    });

    return prismaContracts.map((prismaContract) => {
      const contract = Contract.fromDatabase({
        id: prismaContract.id,
        code: prismaContract.code,
        customer: prismaContract.customer,
        startDate: prismaContract.startDate,
        endDate: prismaContract.endDate,
        value: prismaContract.value,
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
          hourlyRate: assignment.hourlyRate,
          workedHours: assignment.workedHours,
          maintenanceCost: assignment.maintenanceCost,
          generatedIncome: assignment.generatedIncome,
          margin: assignment.margin,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
        });
        contract.addMachineAssignment(machineAssignment);
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
