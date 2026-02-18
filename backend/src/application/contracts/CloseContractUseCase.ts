import { ContractStatus } from '../../domain/contracts/entities/Contract';
import { MachineStatus } from '../../domain/fleet/entities/Machine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CloseContractDTO {
  id: string;
}

export class CloseContractUseCase {
  async execute(dto: CloseContractDTO) {
    const contract = await prisma.contract.findUnique({
      where: { id: dto.id },
      include: { assignments: true },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new Error('Can only close active contracts');
    }

    const activeAssignments = contract.assignments.filter((a) => !a.releasedAt);

    if (activeAssignments.length > 0) {
      const machineIds = activeAssignments.map((a) => a.machineId);
      await prisma.machineAssignment.updateMany({
        where: { id: { in: activeAssignments.map((a) => a.id) } },
        data: { releasedAt: new Date() },
      });

      await prisma.machine.updateMany({
        where: { id: { in: machineIds } },
        data: {
          status: MachineStatus.AVAILABLE,
          updatedAt: new Date(),
        },
      });
    }

    const closed = await prisma.contract.update({
      where: { id: dto.id },
      data: {
        status: ContractStatus.COMPLETED,
        updatedAt: new Date(),
      },
    });

    return closed;
  }
}
