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

    await this.machineRepository.updateStatus(input.machineId, input.newStatus);
  }
}
