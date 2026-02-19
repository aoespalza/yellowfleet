import { MachineStatus } from '../../domain/fleet/MachineStatus';
import { ContractStatus } from '../../domain/contracts/ContractStatus';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AssignMachineToContractDTO {
  machineId: string;
  contractId: string;
  hourlyRate: number;
}

export class AssignMachineToContractUseCase {
  async execute(dto: AssignMachineToContractDTO) {
    const [machine, contract] = await Promise.all([
      prisma.machine.findUnique({ where: { id: dto.machineId } }),
      prisma.contract.findUnique({ where: { id: dto.contractId } }),
    ]);

    if (!machine) {
      throw new Error('Machine not found');
    }

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new Error('Can only assign machines to active contracts');
    }

    if (machine.status === MachineStatus.IN_WORKSHOP) {
      throw new Error('Cannot assign: machine is in workshop');
    }

    // Check if machine is already assigned to an active contract
    const activeAssignment = await prisma.machineAssignment.findFirst({
      where: {
        machineId: dto.machineId,
        contract: {
          status: ContractStatus.ACTIVE,
        },
      },
    });

    if (activeAssignment) {
      throw new Error('Machine already assigned to an active contract');
    }

    const assignment = await prisma.machineAssignment.create({
      data: {
        machineId: dto.machineId,
        contractId: dto.contractId,
        hourlyRate: dto.hourlyRate,
        workedHours: 0,
        maintenanceCost: 0,
        generatedIncome: 0,
        margin: 0,
      },
    });

    await prisma.machine.update({
      where: { id: dto.machineId },
      data: {
        status: MachineStatus.IN_CONTRACT,
        updatedAt: new Date(),
      },
    });

    return assignment;
  }
}
