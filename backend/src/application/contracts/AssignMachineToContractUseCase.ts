import { MachineStatus } from '../../domain/fleet/entities/Machine';
import { ContractStatus } from '../../domain/contracts/entities/Contract';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AssignMachineToContractDTO {
  machineId: string;
  contractId: string;
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

    const activeAssignment = await prisma.machineAssignment.findFirst({
      where: {
        machineId: dto.machineId,
        releasedAt: null,
      },
    });

    if (activeAssignment) {
      throw new Error('Machine already assigned to an active contract');
    }

    const assignment = await prisma.machineAssignment.create({
      data: {
        machineId: dto.machineId,
        contractId: dto.contractId,
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
