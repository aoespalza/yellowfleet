import { IMachineRepository } from '../../application/fleet/IMachineRepository';
import { Machine } from '../../domain/fleet/Machine';
import { MachineStatus } from '../../domain/fleet/MachineStatus';
import prisma from '../prisma/prismaClient';

export class PrismaMachineRepository implements IMachineRepository {
  async save(machine: Machine): Promise<void> {
    await prisma.machine.upsert({
      where: { id: machine.id },
      create: {
        id: machine.id,
        code: machine.code,
        type: machine.type,
        brand: machine.brand,
        model: machine.model,
        year: machine.year,
        serialNumber: machine.serialNumber,
        hourMeter: machine.hourMeter,
        acquisitionDate: machine.acquisitionDate,
        acquisitionValue: machine.acquisitionValue,
        usefulLifeHours: machine.usefulLifeHours,
        status: machine.status as unknown as import('@prisma/client').MachineStatus,
        currentLocation: machine.currentLocation,
        createdAt: machine.createdAt,
        updatedAt: machine.updatedAt,
      },
      update: {
        code: machine.code,
        type: machine.type,
        brand: machine.brand,
        model: machine.model,
        year: machine.year,
        serialNumber: machine.serialNumber,
        hourMeter: machine.hourMeter,
        acquisitionDate: machine.acquisitionDate,
        acquisitionValue: machine.acquisitionValue,
        usefulLifeHours: machine.usefulLifeHours,
        status: machine.status as unknown as import('@prisma/client').MachineStatus,
        currentLocation: machine.currentLocation,
        updatedAt: new Date(),
      },
    });
  }
  
  

  async findById(id: string): Promise<Machine | null> {
    const prismaMachine = await prisma.machine.findUnique({
      where: { id },
    });

    if (!prismaMachine) {
      return null;
    }

    return Machine.create({
      id: prismaMachine.id,
      code: prismaMachine.code,
      type: prismaMachine.type,
      brand: prismaMachine.brand,
      model: prismaMachine.model,
      year: prismaMachine.year,
      serialNumber: prismaMachine.serialNumber,
      hourMeter: prismaMachine.hourMeter,
      acquisitionDate: prismaMachine.acquisitionDate,
      acquisitionValue: prismaMachine.acquisitionValue,
      usefulLifeHours: prismaMachine.usefulLifeHours,
      status: this.mapPrismaStatusToDomain(prismaMachine.status),
      currentLocation: prismaMachine.currentLocation,
      createdAt: prismaMachine.createdAt,
      updatedAt: prismaMachine.updatedAt,
    });
  }

  async findAll(): Promise<Machine[]> {
    const prismaMachines = await prisma.machine.findMany();

    return prismaMachines.map((prismaMachine) =>
      Machine.create({
        id: prismaMachine.id,
        code: prismaMachine.code,
        type: prismaMachine.type,
        brand: prismaMachine.brand,
        model: prismaMachine.model,
        year: prismaMachine.year,
        serialNumber: prismaMachine.serialNumber,
        hourMeter: prismaMachine.hourMeter,
        acquisitionDate: prismaMachine.acquisitionDate,
        acquisitionValue: prismaMachine.acquisitionValue,
        usefulLifeHours: prismaMachine.usefulLifeHours,
        status: this.mapPrismaStatusToDomain(prismaMachine.status),
        currentLocation: prismaMachine.currentLocation,
        createdAt: prismaMachine.createdAt,
        updatedAt: prismaMachine.updatedAt,
      })
    );
  }

  private mapPrismaStatusToDomain(
    prismaStatus: import('@prisma/client').MachineStatus
  ): MachineStatus {
    return MachineStatus[prismaStatus as keyof typeof MachineStatus];
  }
}
