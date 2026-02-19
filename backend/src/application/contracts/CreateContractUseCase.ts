import { Contract } from '../../domain/contracts/Contract';
import { ContractStatus } from '../../domain/contracts/ContractStatus';
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
    // Check for existing contract by code
    const existing = await prisma.contract.findFirst({
      where: { code: dto.code },
    });

    if (existing) {
      throw new Error('Contract code already exists');
    }

    const contract = Contract.create({
      code: dto.code,
      customer: dto.customer,
      startDate: dto.startDate,
      endDate: dto.endDate,
      value: dto.value,
      status: ContractStatus.DRAFT,
      description: dto.description,
    });

    const created = await prisma.contract.create({
      data: {
        id: contract.id!,
        code: contract.code,
        customer: contract.customer,
        startDate: contract.startDate,
        endDate: contract.endDate,
        value: contract.value,
        status: contract.status as unknown as import('@prisma/client').ContractStatus,
        description: contract.description,
      },
    });

    return created;
  }
}
