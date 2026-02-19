import { IMachineRepository } from './IMachineRepository';

export interface UpdateMachineInput {
  id: string;
  code: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  serialNumber: string;
  hourMeter: number;
  acquisitionDate: Date;
  acquisitionValue: number;
  usefulLifeHours: number;
  currentLocation: string;
}

export class UpdateMachine {
  constructor(private machineRepository: IMachineRepository) {}

  async execute(input: UpdateMachineInput): Promise<void> {
    const machine = await this.machineRepository.findById(input.id);

    if (!machine) {
      throw new Error('Machine not found');
    }

    machine.updateDetails({
      code: input.code,
      type: input.type,
      brand: input.brand,
      model: input.model,
      year: input.year,
      serialNumber: input.serialNumber,
      hourMeter: input.hourMeter,
      acquisitionDate: input.acquisitionDate,
      acquisitionValue: input.acquisitionValue,
      usefulLifeHours: input.usefulLifeHours,
      currentLocation: input.currentLocation,
    });

    await this.machineRepository.save(machine);
  }
}
