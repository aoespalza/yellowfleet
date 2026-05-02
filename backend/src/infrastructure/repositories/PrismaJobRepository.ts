import { PrismaClient, Job as PrismaJob } from '@prisma/client';
import { Job, CreateJobDTO, UpdateJobDTO, MachineType, EquipmentCategory } from '../../domain/job/entities/Job';

const prisma = new PrismaClient();

export class PrismaJobRepository {
  
  async create(data: CreateJobDTO): Promise<Job> {
    const job = await prisma.job.create({
      data: {
        name: data.name,
        description: data.description,
        hourlyRate: data.hourlyRate,
        machineTypes: data.machineTypes,
        equipmentCategories: data.equipmentCategories,
        isActive: true,
      },
    });
    return this.mapToJob(job);
  }

  async findAll(): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return jobs.map(this.mapToJob);
  }

  async findById(id: string): Promise<Job | null> {
    const job = await prisma.job.findUnique({
      where: { id },
    });
    return job ? this.mapToJob(job) : null;
  }

  async update(id: string, data: UpdateJobDTO): Promise<Job> {
    const job = await prisma.job.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        hourlyRate: data.hourlyRate,
        isActive: data.isActive,
        machineTypes: data.machineTypes,
        equipmentCategories: data.equipmentCategories,
      },
    });
    return this.mapToJob(job);
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    await prisma.job.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByMachineType(machineType: MachineType): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        machineTypes: { has: machineType },
      },
      orderBy: { name: 'asc' },
    });
    return jobs.map(this.mapToJob);
  }

  async findByEquipmentCategory(category: EquipmentCategory): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        equipmentCategories: { has: category },
      },
      orderBy: { name: 'asc' },
    });
    return jobs.map(this.mapToJob);
  }

  private mapToJob(data: PrismaJob): Job {
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      hourlyRate: data.hourlyRate || undefined,
      isActive: data.isActive,
      machineTypes: data.machineTypes as MachineType[],
      equipmentCategories: data.equipmentCategories as EquipmentCategory[],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}