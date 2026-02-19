import { ContractStatus } from '../../domain/contracts/ContractStatus';
import { MachineStatus } from '../../domain/fleet/MachineStatus';
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

    // Get all machine assignments for this contract
    const assignments = contract.assignments;

    if (assignments.length > 0) {
      const machineIds = assignments.map((a) => a.machineId);
      
      // Update machines to available
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
