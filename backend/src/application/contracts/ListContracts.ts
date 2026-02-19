import { IContractRepository } from './IContractRepository';
import { Contract } from '../../domain/contracts/Contract';

export class ListContracts {
  constructor(private contractRepository: IContractRepository) {}

  async execute(): Promise<Contract[]> {
    return this.contractRepository.findAll();
  }
}
