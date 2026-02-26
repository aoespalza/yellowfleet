import { IContractRepository } from './IContractRepository';
import { Contract } from '../../domain/contracts/Contract';

export interface UpdateContractInput {
  code: string;
  customer: string;
  startDate: Date;
  endDate: Date;
  value: number;
  monthlyValue?: number;
  plazo?: number;
  status: string;
  description: string;
}

export class UpdateContract {
  constructor(private contractRepository: IContractRepository) {}

  async execute(id: string, input: UpdateContractInput): Promise<void> {
    const contract = await this.contractRepository.findById(id);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    contract.update({
      code: input.code,
      customer: input.customer,
      startDate: input.startDate,
      endDate: input.endDate,
      value: input.value,
      monthlyValue: input.monthlyValue,
      plazo: input.plazo,
      status: input.status as any,
      description: input.description,
    });

    await this.contractRepository.save(contract);
  }
}
