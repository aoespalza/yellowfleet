import { Operator, OperatorProps } from './entities/Operator';

export interface IOperatorRepository {
  create(operator: Operator): Promise<Operator>;
  findAll(): Promise<Operator[]>;
  findActive(): Promise<Operator[]>;
  findById(id: string): Promise<Operator | null>;
  update(id: string, data: Partial<Operator>): Promise<Operator>;
  delete(id: string): Promise<void>;
  assignToMachine(operatorId: string, machineId: string): Promise<void>;
  unassignFromMachine(machineId: string): Promise<void>;
  getMachinesByOperator(operatorId: string): Promise<any[]>;
  getCurrentOperatorByMachine(machineId: string): Promise<Operator | null>;
  getAssignmentHistory(machineId: string): Promise<any[]>;
}
