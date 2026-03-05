import { Operator } from '../../domain/operator/entities/Operator';
import { IOperatorRepository } from '../../domain/operator/IOperatorRepository';
import prisma from '../prisma/prismaClient';

export class PrismaOperatorRepository implements IOperatorRepository {
  async create(operator: Operator): Promise<Operator> {
    const data = (operator as any).toPrisma();
    const created = await prisma.operator.create({ data });
    return new Operator(created);
  }

  async findAll(): Promise<Operator[]> {
    const operators = await prisma.operator.findMany({
      orderBy: { name: 'asc' }
    });
    return operators.map(op => new Operator(op));
  }

  async findActive(): Promise<Operator[]> {
    const operators = await prisma.operator.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return operators.map(op => new Operator(op));
  }

  async findById(id: string): Promise<Operator | null> {
    const operator = await prisma.operator.findUnique({ where: { id } });
    return operator ? new Operator(operator) : null;
  }

  async update(id: string, data: Partial<Operator>): Promise<Operator> {
    const updateData: any = { ...data };
    
    const updated = await prisma.operator.update({
      where: { id },
      data: updateData
    });
    return new Operator(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.operator.delete({ where: { id } });
  }

  async assignToMachine(operatorId: string, machineId: string): Promise<void> {
    // Desactivar asignaciones anteriores de esta máquina
    await prisma.machineOperatorAssignment.updateMany({
      where: { machineId, isActive: true },
      data: { isActive: false, endDate: new Date() }
    });

    // Crear nueva asignación
    await prisma.machineOperatorAssignment.create({
      data: {
        machineId,
        operatorId,
        isActive: true
      }
    });

    // Actualizar el operador actual en la máquina
    await prisma.machine.update({
      where: { id: machineId },
      data: { currentOperatorId: operatorId }
    });
  }

  async unassignFromMachine(machineId: string): Promise<void> {
    // Desactivar la asignación activa
    await prisma.machineOperatorAssignment.updateMany({
      where: { machineId, isActive: true },
      data: { isActive: false, endDate: new Date() }
    });

    // Quitar el operador actual de la máquina
    await prisma.machine.update({
      where: { id: machineId },
      data: { currentOperatorId: null }
    });
  }

  async getMachinesByOperator(operatorId: string): Promise<any[]> {
    const assignments = await prisma.machineOperatorAssignment.findMany({
      where: { operatorId },
      include: { machine: true },
      orderBy: { startDate: 'desc' }
    });
    return assignments;
  }

  async getCurrentOperatorByMachine(machineId: string): Promise<Operator | null> {
    const assignment = await prisma.machineOperatorAssignment.findFirst({
      where: { machineId, isActive: true },
      include: { operator: true }
    });
    return assignment ? new Operator(assignment.operator) : null;
  }

  async getAssignmentHistory(machineId: string): Promise<any[]> {
    const assignments = await prisma.machineOperatorAssignment.findMany({
      where: { machineId },
      include: { operator: true },
      orderBy: { startDate: 'desc' }
    });
    return assignments;
  }
}
