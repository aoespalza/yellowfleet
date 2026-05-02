import { Request, Response } from 'express';
import { EquipmentUseCases } from '../../../application/operator/EquipmentUseCases';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from '../../../domain/operator/entities/Equipment';

const useCases = new EquipmentUseCases();

export class EquipmentController {
  
  // ============ CATÁLOGO DE EPP ============
  
  async list(req: Request, res: Response) {
    try {
      const equipment = await useCases.listEquipment();
      res.json(equipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const equipment = await useCases.getEquipmentById(id);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }
      res.json(equipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateEquipmentDTO = req.body;
      const equipment = await useCases.createEquipment(data);
      res.status(201).json(equipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateEquipmentDTO = req.body;
      const equipment = await useCases.updateEquipment(id, data);
      res.json(equipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await useCases.deleteEquipment(id);
      res.json({ message: 'Equipo eliminado' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ============ DOTACIÓN ============
  
  async deliver(req: Request, res: Response) {
    try {
      const data = req.body;
      // Obtener usuario del token
      const user = (req as any).user;
      const deliveredBy = user?.id;
      
      const delivery = await useCases.deliverEquipment({
        ...data,
        deliveredBy,
      });
      res.status(201).json(delivery);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOperatorEquipment(req: Request, res: Response) {
    try {
      const { operatorId } = req.params;
      const deliveries = await useCases.getOperatorEquipment(operatorId);
      res.json(deliveries);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllDeliveries(req: Request, res: Response) {
    try {
      const deliveries = await useCases.getAllDeliveries();
      res.json(deliveries);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOverdue(req: Request, res: Response) {
    try {
      const deliveries = await useCases.getOverdueDeliveries();
      res.json(deliveries);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUpcoming(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const deliveries = await useCases.getUpcomingDeliveries(days);
      res.json(deliveries);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteDelivery(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await useCases.deleteDelivery(id);
      res.json({ message: 'Entrega eliminada' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ============ DOTACIÓN PENDIENTE POR CARGO ============
  
  async getAllPending(req: Request, res: Response) {
    try {
      const pending = await useCases.getAllPendingEquipment();
      res.json(pending);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPendingByOperator(req: Request, res: Response) {
    try {
      const { operatorId } = req.params;
      const pending = await useCases.getPendingEquipmentByOperator(operatorId);
      if (!pending) {
        return res.status(404).json({ error: 'Operario no encontrado' });
      }
      res.json(pending);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}