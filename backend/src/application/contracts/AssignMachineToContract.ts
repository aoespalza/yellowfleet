import { IContractRepository } from './IContractRepository';
import { MachineAssignment } from '../../domain/contracts/MachineAssignment';
import { MachineAssignmentProps } from '../../domain/contracts/MachineAssignmentProps';

export interface AssignMachineInput {
  contractId: string;
  machineId: string;
  hourlyRate: number;
}

export class AssignMachineToContract {
  constructor(private contractRepository: IContractRepository) {}

  async execute(input: AssignMachineInput): Promise<void> {
    const contract = await this.contractRepository.findById(input.contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    const assignmentProps: MachineAssignmentProps = {
      contractId: input.contractId,
      machineId: input.machineId,
      hourlyRate: input.hourlyRate,
      workedHours: 0,
      maintenanceCost: 0,
      generatedIncome: 0,
      margin: 0,
    };

    const assignment = MachineAssignment.create(assignmentProps);
    contract.addMachineAssignment(assignment);
    await this.contractRepository.save(contract);
  }
}
