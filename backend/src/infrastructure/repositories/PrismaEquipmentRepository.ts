import { PrismaClient, Equipment as PrismaEquipment, OperatorEquipment as PrismaOperatorEquipment } from '@prisma/client';
import { Equipment, CreateEquipmentDTO, UpdateEquipmentDTO, EquipmentCategory, EquipmentSize } from '../../domain/operator/entities/Equipment';
import { OperatorEquipment, CreateOperatorEquipmentDTO, OperatorEquipmentWithDetails } from '../../domain/operator/entities/OperatorEquipment';

const prisma = new PrismaClient();

export class PrismaEquipmentRepository {
  
  // ============ EQUIPMENT (Catálogo de EPP) ============
  
  async create(data: CreateEquipmentDTO): Promise<Equipment> {
    const equipment = await prisma.equipment.create({
      data: {
        name: data.name,
        category: data.category as any,
        clothingType: data.clothingType as any,
        description: data.description,
        defaultPeriodicityDays: data.defaultPeriodicityDays,
        hasSizes: data.hasSizes || false,
        isActive: true,
      },
    });
    return this.mapToEquipment(equipment);
  }

  async findAll(): Promise<Equipment[]> {
    const items = await prisma.equipment.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return items.map(this.mapToEquipment);
  }

  async findById(id: string): Promise<Equipment | null> {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
    });
    return equipment ? this.mapToEquipment(equipment) : null;
  }

  async update(id: string, data: UpdateEquipmentDTO): Promise<Equipment> {
    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category as any,
        clothingType: data.clothingType as any,
        description: data.description,
        defaultPeriodicityDays: data.defaultPeriodicityDays,
        hasSizes: data.hasSizes,
        isActive: data.isActive,
      },
    });
    return this.mapToEquipment(equipment);
  }

  async delete(id: string): Promise<void> {
    // Soft delete - marcar como inactivo
    await prisma.equipment.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============ OPERATOR EQUIPMENT (Dotación) ============
  
  async deliverEquipment(data: CreateOperatorEquipmentDTO): Promise<OperatorEquipment> {
    // Calcular próxima fecha de entrega
    const equipment = await prisma.equipment.findUnique({
      where: { id: data.equipmentId },
    });
    
    const deliveryDate = data.deliveryDate || new Date();
    const periodicityDays = equipment?.defaultPeriodicityDays || 30;
    const nextDeliveryDate = new Date(deliveryDate);
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + periodicityDays);

    const delivery = await prisma.operatorEquipment.create({
      data: {
        operatorId: data.operatorId,
        equipmentId: data.equipmentId,
        deliveryDate,
        nextDeliveryDate,
        quantity: data.quantity || 1,
        size: data.size as any,
        notes: data.notes,
        deliveredBy: data.deliveredBy,
      },
    });
    return this.mapToOperatorEquipment(delivery);
  }

  async findEquipmentByOperator(operatorId: string): Promise<OperatorEquipmentWithDetails[]> {
    const deliveries = await prisma.operatorEquipment.findMany({
      where: { operatorId },
      include: {
        equipment: true,
        operator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { deliveryDate: 'desc' },
    });
    
    return deliveries.map(d => ({
      id: d.id,
      operatorId: d.operatorId,
      equipmentId: d.equipmentId,
      deliveryDate: d.deliveryDate,
      nextDeliveryDate: d.nextDeliveryDate,
      quantity: d.quantity,
      notes: d.notes || undefined,
      deliveredBy: d.deliveredBy || undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      equipment: {
        id: d.equipment.id,
        name: d.equipment.name,
        category: d.equipment.category,
        defaultPeriodicityDays: d.equipment.defaultPeriodicityDays,
        hasSizes: d.equipment.hasSizes,
      },
      operator: {
        id: d.operator.id,
        name: d.operator.name,
      },
    }));
  }

  async findAllDeliveries(): Promise<OperatorEquipmentWithDetails[]> {
    const deliveries = await prisma.operatorEquipment.findMany({
      include: {
        equipment: true,
        operator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { deliveryDate: 'desc' },
    });
    
    return deliveries.map(d => ({
      id: d.id,
      operatorId: d.operatorId,
      equipmentId: d.equipmentId,
      deliveryDate: d.deliveryDate,
      nextDeliveryDate: d.nextDeliveryDate,
      quantity: d.quantity,
      notes: d.notes || undefined,
      deliveredBy: d.deliveredBy || undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      equipment: {
        id: d.equipment.id,
        name: d.equipment.name,
        category: d.equipment.category,
        defaultPeriodicityDays: d.equipment.defaultPeriodicityDays,
        hasSizes: d.equipment.hasSizes,
      },
      operator: {
        id: d.operator.id,
        name: d.operator.name,
      },
    }));
  }

  async findOverdueDeliveries(): Promise<OperatorEquipmentWithDetails[]> {
    const now = new Date();
    const deliveries = await prisma.operatorEquipment.findMany({
      where: {
        nextDeliveryDate: { lt: now },
      },
      include: {
        equipment: true,
        operator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { nextDeliveryDate: 'asc' },
    });
    
    return deliveries.map(d => ({
      id: d.id,
      operatorId: d.operatorId,
      equipmentId: d.equipmentId,
      deliveryDate: d.deliveryDate,
      nextDeliveryDate: d.nextDeliveryDate,
      quantity: d.quantity,
      notes: d.notes || undefined,
      deliveredBy: d.deliveredBy || undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      equipment: {
        id: d.equipment.id,
        name: d.equipment.name,
        category: d.equipment.category,
        defaultPeriodicityDays: d.equipment.defaultPeriodicityDays,
        hasSizes: d.equipment.hasSizes,
      },
      operator: {
        id: d.operator.id,
        name: d.operator.name,
      },
    }));
  }

  async findUpcomingDeliveries(daysAhead: number = 7): Promise<OperatorEquipmentWithDetails[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const deliveries = await prisma.operatorEquipment.findMany({
      where: {
        nextDeliveryDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        equipment: true,
        operator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { nextDeliveryDate: 'asc' },
    });
    
    return deliveries.map(d => ({
      id: d.id,
      operatorId: d.operatorId,
      equipmentId: d.equipmentId,
      deliveryDate: d.deliveryDate,
      nextDeliveryDate: d.nextDeliveryDate,
      quantity: d.quantity,
      notes: d.notes || undefined,
      deliveredBy: d.deliveredBy || undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      equipment: {
        id: d.equipment.id,
        name: d.equipment.name,
        category: d.equipment.category,
        defaultPeriodicityDays: d.equipment.defaultPeriodicityDays,
        hasSizes: d.equipment.hasSizes,
      },
      operator: {
        id: d.operator.id,
        name: d.operator.name,
      },
    }));
  }

  async deleteDelivery(id: string): Promise<void> {
    await prisma.operatorEquipment.delete({
      where: { id },
    });
  }

  // ============ DOTACIÓN PENDIENTE POR CARGO ============
  
  async findPendingEquipmentByOperator(operatorId: string): Promise<{
    operatorId: string;
    operatorName: string;
    jobId: string | null;
    jobName: string | null;
    pendingItems: {
      equipmentId: string;
      equipmentName: string;
      category: string;
      categoryLabel: string;
    }[];
  } | null> {
    // Obtener operador con su cargo
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      include: { job: true }
    });

    if (!operator) return null;

    // Obtener equipos que ha recibido el operador
    const deliveredEquipment = await prisma.operatorEquipment.findMany({
      where: { operatorId },
      select: { equipmentId: true }
    });
    const deliveredIds = new Set(deliveredEquipment.map(e => e.equipmentId));

    // Obtener todos los equipos activos del catálogo
    const allEquipment = await prisma.equipment.findMany({
      where: { isActive: true }
    });

    // Si tiene cargo, filtrar solo los de su cargo
    let relevantEquipment = allEquipment;
    if (operator.jobId && operator.job) {
      const job = operator.job as any;
      const allowedCategories = job.equipmentCategories || [];
      relevantEquipment = allEquipment.filter(eq => 
        allowedCategories.includes(eq.category)
      );
    }

    // Filtrar los que NO ha recibido
    const pending = relevantEquipment
      .filter(eq => !deliveredIds.has(eq.id))
      .map(eq => ({
        equipmentId: eq.id,
        equipmentName: eq.name,
        category: eq.category,
        categoryLabel: this.getCategoryLabel(eq.category)
      }));

    return {
      operatorId: operator.id,
      operatorName: operator.name,
      jobId: operator.jobId,
      jobName: operator.job ? (operator.job as any).name : null,
      pendingItems: pending
    };
  }

  async findAllPendingEquipment(): Promise<Array<{
    operatorId: string;
    operatorName: string;
    jobId: string | null;
    jobName: string | null;
    pendingItems: {
      equipmentId: string;
      equipmentName: string;
      category: string;
      categoryLabel: string;
    }[];
  }>> {
    // Obtener todos los operadores activos
    const operators = await prisma.operator.findMany({
      where: { isActive: true },
      include: { job: true }
    });

    const results = [];

    for (const operator of operators) {
      // Obtener equipos que ha recibido el operador
      const deliveredEquipment = await prisma.operatorEquipment.findMany({
        where: { operatorId: operator.id },
        select: { equipmentId: true }
      });
      const deliveredIds = new Set(deliveredEquipment.map(e => e.equipmentId));

      // Obtener todos los equipos activos
      const allEquipment = await prisma.equipment.findMany({
        where: { isActive: true }
      });

      // Si tiene cargo, filtrar solo los de su cargo
      let relevantEquipment = allEquipment;
      if (operator.jobId && operator.job) {
        const job = operator.job as any;
        const allowedCategories = job.equipmentCategories || [];
        relevantEquipment = allEquipment.filter(eq => 
          allowedCategories.includes(eq.category)
        );
      }

      // Filtrar los que NO ha recibido
      const pending = relevantEquipment
        .filter(eq => !deliveredIds.has(eq.id))
        .map(eq => ({
          equipmentId: eq.id,
          equipmentName: eq.name,
          category: eq.category,
          categoryLabel: this.getCategoryLabel(eq.category)
        }));

      if (pending.length > 0) {
        results.push({
          operatorId: operator.id,
          operatorName: operator.name,
          jobId: operator.jobId,
          jobName: operator.job ? (operator.job as any).name : null,
          pendingItems: pending
        });
      }
    }

    return results;
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      PROTECTION_CRANIAL: 'Protección Craneana',
      PROTECTION_HANDS: 'Protección de Manos',
      PROTECTION_FEET: 'Protección de Pies',
      PROTECTION_VISUAL: 'Protección Visual',
      PROTECTION_RESPIRATORY: 'Protección Respiratoria',
      VEST: 'Chalecos',
      PROTECTION_HEARING: 'Protección Auditiva',
      CLOTHING: 'Ropa',
      OTHER: 'Otros'
    };
    return labels[category] || category;
  }

  // ============ MAPPERS ============
  
  private mapToEquipment(data: PrismaEquipment): Equipment {
    return {
      id: data.id,
      name: data.name,
      category: data.category as EquipmentCategory,
      clothingType: data.clothingType as any,
      description: data.description || undefined,
      defaultPeriodicityDays: data.defaultPeriodicityDays,
      hasSizes: data.hasSizes,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapToOperatorEquipment(data: PrismaOperatorEquipment): OperatorEquipment {
    return {
      id: data.id,
      operatorId: data.operatorId,
      equipmentId: data.equipmentId,
      deliveryDate: data.deliveryDate,
      nextDeliveryDate: data.nextDeliveryDate,
      quantity: data.quantity,
      size: data.size as EquipmentSize || undefined,
      notes: data.notes || undefined,
      deliveredBy: data.deliveredBy || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
