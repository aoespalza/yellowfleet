import { PrismaEquipmentRepository } from '../../infrastructure/repositories/PrismaEquipmentRepository';
import { Equipment, CreateEquipmentDTO, UpdateEquipmentDTO, EquipmentSize } from '../../domain/operator/entities/Equipment';

const repository = new PrismaEquipmentRepository();

export class EquipmentUseCases {
  
  // Catálogo de EPP
  async createEquipment(data: CreateEquipmentDTO): Promise<Equipment> {
    if (!data.name || !data.category || !data.defaultPeriodicityDays) {
      throw new Error('Faltan datos requeridos');
    }
    return repository.create(data);
  }

  async listEquipment(): Promise<Equipment[]> {
    return repository.findAll();
  }

  async getEquipmentById(id: string): Promise<Equipment | null> {
    return repository.findById(id);
  }

  async updateEquipment(id: string, data: UpdateEquipmentDTO): Promise<Equipment> {
    return repository.update(id, data);
  }

  async deleteEquipment(id: string): Promise<void> {
    return repository.delete(id);
  }

  // Dotación
  async deliverEquipment(data: {
    operatorId: string;
    equipmentId: string;
    quantity?: number;
    size?: EquipmentSize;
    notes?: string;
    deliveredBy?: string;
  }) {
    if (!data.operatorId || !data.equipmentId) {
      throw new Error('Faltan datos requeridos');
    }
    return repository.deliverEquipment({
      operatorId: data.operatorId,
      equipmentId: data.equipmentId,
      quantity: data.quantity,
      size: data.size,
      notes: data.notes,
      deliveredBy: data.deliveredBy,
    });
  }

  async getOperatorEquipment(operatorId: string) {
    return repository.findEquipmentByOperator(operatorId);
  }

  async getAllDeliveries() {
    return repository.findAllDeliveries();
  }

  async getOverdueDeliveries() {
    return repository.findOverdueDeliveries();
  }

  async getUpcomingDeliveries(daysAhead: number = 7) {
    return repository.findUpcomingDeliveries(daysAhead);
  }

  async deleteDelivery(id: string) {
    return repository.deleteDelivery(id);
  }

  // Dotación pendiente por cargo
  async getPendingEquipmentByOperator(operatorId: string) {
    return repository.findPendingEquipmentByOperator(operatorId);
  }

  async getAllPendingEquipment() {
    return repository.findAllPendingEquipment();
  }
}
