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
        imageUrl: machine.imageUrl,
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
        imageUrl: machine.imageUrl,
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

    return this.toDomain(prismaMachine);
  }

  async findAll(): Promise<Machine[]> {
    const prismaMachines = await prisma.machine.findMany();

    return prismaMachines.map((prismaMachine) =>
      this.toDomain(prismaMachine)
    );
  }

  async delete(id: string): Promise<void> {
    await prisma.machine.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: MachineStatus): Promise<void> {
    await prisma.machine.update({
      where: { id },
      data: {
        status: status as unknown as import('@prisma/client').MachineStatus,
        updatedAt: new Date(),
      },
    });
  }

  // 🔥 Mapper centralizado (PRO)
  private toDomain(prismaMachine: any): Machine {
    return Machine.restore({
      id: prismaMachine.id,
      code: prismaMachine.code,
      type: prismaMachine.type ?? '',
      brand: prismaMachine.brand ?? '',
      model: prismaMachine.model ?? '',
      imageUrl: prismaMachine.imageUrl ?? null,
      year: prismaMachine.year ?? new Date().getFullYear(),
      serialNumber: prismaMachine.serialNumber ?? '',
      hourMeter: prismaMachine.hourMeter ?? 0,
      acquisitionDate: prismaMachine.acquisitionDate ?? new Date(),
      acquisitionValue: prismaMachine.acquisitionValue ?? 0,
      usefulLifeHours: prismaMachine.usefulLifeHours ?? 0,
      status: this.mapPrismaStatusToDomain(prismaMachine.status),
      currentLocation: prismaMachine.currentLocation ?? '',
      createdAt: prismaMachine.createdAt,
      updatedAt: prismaMachine.updatedAt,
    });
  }

  async update(id: string, data: Partial<{ hourMeter: number }>): Promise<void> {
    await prisma.machine.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  private mapPrismaStatusToDomain(
    prismaStatus: import('@prisma/client').MachineStatus
  ): MachineStatus {
    return MachineStatus[
      prismaStatus as keyof typeof MachineStatus
    ];
  }
}
