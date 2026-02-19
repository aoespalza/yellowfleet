import { IMachineRepository } from './IMachineRepository';
import { Machine } from '../../domain/fleet/Machine';
import { MachineStatus } from '../../domain/fleet/MachineStatus';


export interface CreateMachineInput {
  code: string;
  type: string;
  brand: string;
  model: string;
  imageUrl?: string;
  year: number;
  serialNumber: string;
  hourMeter: number;
  acquisitionDate: Date;
  acquisitionValue: number;
  usefulLifeHours: number;
  currentLocation: string;
}

export class CreateMachine {
  constructor(private machineRepository: IMachineRepository) {}

  async execute(input: CreateMachineInput): Promise<void> {
    const machine = Machine.create({
      code: input.code,
      type: input.type,
      brand: input.brand,
      model: input.model,
      imageUrl: input.imageUrl,
      year: input.year,
      serialNumber: input.serialNumber,
      hourMeter: input.hourMeter,
      acquisitionDate: input.acquisitionDate,
      acquisitionValue: input.acquisitionValue,
      usefulLifeHours: input.usefulLifeHours,
      status: MachineStatus.AVAILABLE,
      currentLocation: input.currentLocation,
    });

    await this.machineRepository.save(machine);
  }
}
