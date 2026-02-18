import { IMachineRepository } from './IMachineRepository';
import { MachineStatus } from '../../domain/fleet/MachineStatus';

export interface ChangeMachineStatusInput {
  machineId: string;
  newStatus: MachineStatus;
}

export class ChangeMachineStatus {
  constructor(private machineRepository: IMachineRepository) {}

  async execute(input: ChangeMachineStatusInput): Promise<void> {
    const machine = await this.machineRepository.findById(input.machineId);

    if (!machine) {
      throw new Error('Machine not found');
    }

    switch (input.newStatus) {
      case MachineStatus.IN_CONTRACT:
        machine.assignToContract();
        break;
      case MachineStatus.IN_WORKSHOP:
        machine.sendToWorkshop();
        break;
      case MachineStatus.AVAILABLE:
        machine.markAvailable();
        break;
    }

    await this.machineRepository.save(machine);
  }
}
