import { Operator } from '../../domain/operator/entities/Operator';
import { IOperatorRepository } from '../../domain/operator/IOperatorRepository';
import prisma from '../../infrastructure/prisma/prismaClient';

export class CreateOperator {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(data: {
    name: string;
    licenseNumber?: string;
    phone?: string;
    email?: string;
    hireDate?: Date;
    notes?: string;
  }): Promise<Operator> {
    const operator = new Operator({
      name: data.name,
      licenseNumber: data.licenseNumber,
      phone: data.phone,
      email: data.email,
      hireDate: data.hireDate,
      notes: data.notes,
      isActive: true,
    });

    return await this.repository.create(operator);
  }
}

export class ListOperators {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(activeOnly: boolean = false): Promise<Operator[]> {
    if (activeOnly) {
      return await this.repository.findActive();
    }
    return await this.repository.findAll();
  }
}

export class GetOperatorById {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(id: string): Promise<Operator> {
    const operator = await this.repository.findById(id);
    if (!operator) {
      throw new Error('Operator not found');
    }
    return operator;
  }
}

export class UpdateOperator {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(id: string, data: {
    name?: string;
    licenseNumber?: string;
    phone?: string;
    email?: string;
    hireDate?: Date;
    isActive?: boolean;
    notes?: string;
  }): Promise<Operator> {
    const operator = await this.repository.findById(id);
    if (!operator) {
      throw new Error('Operator not found');
    }

    return await this.repository.update(id, data);
  }
}

export class DeleteOperator {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(id: string): Promise<void> {
    const operator = await this.repository.findById(id);
    if (!operator) {
      throw new Error('Operator not found');
    }
    await this.repository.delete(id);
  }
}

export class AssignOperatorToMachine {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(operatorId: string, machineId: string): Promise<void> {
    // Verificar que el operador existe
    const operator = await this.repository.findById(operatorId);
    if (!operator) {
      throw new Error('Operator not found');
    }

    // Verificar que la máquina existe
    const machine = await prisma.machine.findUnique({ where: { id: machineId } });
    if (!machine) {
      throw new Error('Machine not found');
    }

    // Asignar el operador a la máquina
    await this.repository.assignToMachine(operatorId, machineId);
  }
}

export class UnassignOperatorFromMachine {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(machineId: string): Promise<void> {
    await this.repository.unassignFromMachine(machineId);
  }
}

export class GetOperatorMachines {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(operatorId: string): Promise<any[]> {
    return await this.repository.getMachinesByOperator(operatorId);
  }
}

export class GetMachineCurrentOperator {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(machineId: string): Promise<Operator | null> {
    return await this.repository.getCurrentOperatorByMachine(machineId);
  }
}

export class GetMachineOperatorHistory {
  private repository: IOperatorRepository;

  constructor(repository: IOperatorRepository) {
    this.repository = repository;
  }

  async execute(machineId: string): Promise<any[]> {
    return await this.repository.getAssignmentHistory(machineId);
  }
}
