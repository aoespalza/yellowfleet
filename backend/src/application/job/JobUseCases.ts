import { PrismaJobRepository } from '../../infrastructure/repositories/PrismaJobRepository';
import { Job, CreateJobDTO, UpdateJobDTO, MachineType, EquipmentCategory } from '../../domain/job/entities/Job';

const repository = new PrismaJobRepository();

export class JobUseCases {
  
  async createJob(data: CreateJobDTO): Promise<Job> {
    if (!data.name) {
      throw new Error('El nombre del cargo es requerido');
    }
    return repository.create(data);
  }

  async listJobs(): Promise<Job[]> {
    return repository.findAll();
  }

  async getJobById(id: string): Promise<Job | null> {
    return repository.findById(id);
  }

  async updateJob(id: string, data: UpdateJobDTO): Promise<Job> {
    return repository.update(id, data);
  }

  async deleteJob(id: string): Promise<void> {
    return repository.delete(id);
  }

  async getJobsByMachineType(machineType: MachineType): Promise<Job[]> {
    return repository.findByMachineType(machineType);
  }

  async getJobsByEquipmentCategory(category: EquipmentCategory): Promise<Job[]> {
    return repository.findByEquipmentCategory(category);
  }
}