import { IContractRepository } from './IContractRepository';
import { Contract } from '../../domain/contracts/Contract';

export class ListContracts {
  constructor(private contractRepository: IContractRepository) {}

  async execute(includeAll: boolean = false): Promise<Contract[]> {
    return this.contractRepository.findAll(!includeAll);
  }
}
