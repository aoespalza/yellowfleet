import { Machine } from '../../domain/fleet/Machine';
import { MachineStatus } from '../../domain/fleet/MachineStatus';

export interface IMachineRepository {
  save(machine: Machine): Promise<void>;
  findById(id: string): Promise<Machine | null>;
  findAll(): Promise<Machine[]>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: MachineStatus): Promise<void>;
}
