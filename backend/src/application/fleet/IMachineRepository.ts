import { Machine } from '../../domain/fleet/Machine';

export interface IMachineRepository {
  save(machine: Machine): Promise<void>;
  findById(id: string): Promise<Machine | null>;
  findAll(): Promise<Machine[]>;
  delete(id: string): Promise<void>;

}
