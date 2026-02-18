import { IContractRepository } from './IContractRepository';

export class CloseContract {
  constructor(private contractRepository: IContractRepository) {}

  async execute(contractId: string): Promise<void> {
    const contract = await this.contractRepository.findById(contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    contract.complete();
    await this.contractRepository.save(contract);
  }
}
