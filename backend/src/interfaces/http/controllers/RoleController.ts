import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RoleController {
  async list(req: Request, res: Response) {
    try {
      const roles = await prisma.role.findMany({
        orderBy: { name: 'asc' }
      });
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: 'Error fetching roles' });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const role = await prisma.role.findUnique({
        where: { name: req.params.name }
      });
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json(role);
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({ error: 'Error fetching role' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const role = await prisma.role.create({
        data: req.body
      });
      res.status(201).json(role);
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ error: 'Error creating role' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const role = await prisma.role.update({
        where: { name: req.params.name },
        data: req.body
      });
      res.json(role);
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ error: 'Error updating role' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await prisma.role.delete({
        where: { name: req.params.name }
      });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ error: 'Error deleting role' });
    }
  }
}
