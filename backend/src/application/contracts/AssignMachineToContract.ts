import { IContractRepository } from './IContractRepository';
import { MachineAssignment } from '../../domain/contracts/MachineAssignment';
import { MachineStatus } from '../../domain/fleet/MachineStatus';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export interface AssignMachineInput {
  contractId: string;
  machineId: string;
}

export class AssignMachineToContract {
  constructor(private contractRepository: IContractRepository) {}

  async execute(input: AssignMachineInput): Promise<void> {
    console.log('AssignMachineToContract.execute:', input);
    
    const contract = await this.contractRepository.findById(input.contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Calcular tarifa por hora: valor mensual / 1
    const monthlyValue = contract.monthlyValue || 0;
    const hourlyRate = monthlyValue > 0 ? monthlyValue / 1 : 0;

    const assignment = MachineAssignment.create({
      contractId: input.contractId,
      machineId: input.machineId,
      hourlyRate,
      workedHours: 0,
      maintenanceCost: 0,
      generatedIncome: 0,
      margin: 0,
    });

    contract.addMachineAssignment(assignment);
    await this.contractRepository.save(contract);

    // Actualizar estado de la máquina a IN_CONTRACT
    await prismaClient.machine.update({
      where: { id: input.machineId },
      data: {
        status: MachineStatus.IN_CONTRACT as any,
        updatedAt: new Date(),
      },
    });
  }
}
