import { IContractRepository } from './IContractRepository';
import { Contract } from '../../domain/contracts/Contract';
import { ContractStatus } from '../../domain/contracts/ContractStatus';

export interface CreateContractInput {
  code: string;
  customer: string;
  startDate: Date;
  endDate: Date;
  value: number;
  description?: string;
}

export class CreateContract {
  constructor(private contractRepository: IContractRepository) {}

  async execute(input: CreateContractInput): Promise<void> {
    const contract = Contract.create({
      code: input.code,
      customer: input.customer,
      startDate: input.startDate,
      endDate: input.endDate,
      value: input.value,
      status: ContractStatus.DRAFT,
      description: input.description,
    });

    await this.contractRepository.save(contract);
  }
}
