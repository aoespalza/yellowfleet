import { IMachineRepository } from './IMachineRepository';
import { Machine } from '../../domain/fleet/Machine';

export class GetMachineById {
  constructor(private machineRepository: IMachineRepository) {}

  async execute(id: string): Promise<Machine> {
    const machine = await this.machineRepository.findById(id);

    if (!machine) {
      throw new Error('Machine not found');
    }

    return machine;
  }
}
