import { IMachineRepository } from './IMachineRepository';
import { Machine } from '../../domain/fleet/Machine';

export class ListMachines {
  constructor(private machineRepository: IMachineRepository) {}

  async execute(): Promise<Machine[]> {
    return this.machineRepository.findAll();
  }
}
