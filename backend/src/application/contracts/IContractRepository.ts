import { Contract } from '../../domain/contracts/Contract';

export interface IContractRepository {
  save(contract: Contract): Promise<void>;
  findById(id: string): Promise<Contract | null>;
  findAll(): Promise<Contract[]>;
}
