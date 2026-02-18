import { IContractRepository } from '../../application/contracts/IContractRepository';
import { Contract } from '../../domain/contracts/Contract';
import { ContractStatus } from '../../domain/contracts/ContractStatus';
import { MachineAssignment } from '../../domain/contracts/MachineAssignment';
import { MachineAssignmentProps } from '../../domain/contracts/MachineAssignmentProps';
import prisma from '../prisma/prismaClient';

export class PrismaContractRepository implements IContractRepository {
  async save(contract: Contract): Promise<void> {
    await prisma.$transaction([
      prisma.machineAssignment.deleteMany({
        where: { contractId: contract.id },
      }),
      prisma.contract.upsert({
        where: { id: contract.id },
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
      }),
    ]);

    const assignments = contract.getAssignments();
    if (assignments.length > 0) {
      await prisma.machineAssignment.createMany({
        data: assignments.map((assignment) => ({
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
        })),
      });
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

    const contract = Contract.create({
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
      const assignmentProps: MachineAssignmentProps = {
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
      };
      const machineAssignment = MachineAssignment.create(assignmentProps);
      contract.addMachineAssignment(machineAssignment);
    }

    return contract;
  }

  async findAll(): Promise<Contract[]> {
    const prismaContracts = await prisma.contract.findMany({
      include: { assignments: true },
    });

    return prismaContracts.map((prismaContract) => {
      const contract = Contract.create({
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
        const assignmentProps: MachineAssignmentProps = {
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
        };
        const machineAssignment = MachineAssignment.create(assignmentProps);
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
