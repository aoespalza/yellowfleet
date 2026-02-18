import { Contract, ContractStatus } from '../../domain/contracts/entities/Contract';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateContractDTO {
  code: string;
  customer: string;
  startDate: Date;
  endDate: Date;
  value: number;
  description?: string;
}

export class CreateContractUseCase {
  async execute(dto: CreateContractDTO) {
    const existing = await prisma.contract.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new Error('Contract code already exists');
    }

    const contract = new Contract({
      code: dto.code,
      customer: dto.customer,
      startDate: dto.startDate,
      endDate: dto.endDate,
      value: dto.value,
      status: ContractStatus.DRAFT,
      description: dto.description,
    });

    const created = await prisma.contract.create({
      data: contract.toPlainObject(),
    });

    return created;
  }
}
