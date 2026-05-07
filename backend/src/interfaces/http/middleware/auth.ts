import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { rlsStorage } from '../../../infrastructure/prisma/prismaClient';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret) as { id: string; username: string; role: string };

    req.userId = decoded.id;
    req.userRole = decoded.role;

    // Propagar contexto RLS: cada query autenticada corre como yf_app con las políticas del rol
    rlsStorage.run({ userId: decoded.id, userRole: decoded.role }, next);
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.userRole;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Verifica un permiso granular de la tabla Role.
// ADMIN siempre tiene acceso; otros roles se consultan en DB.
export const authorizePermission = (permissionField: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.userRole;
    if (!userRole) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    if (userRole === 'ADMIN') { next(); return; }
    try {
      const role = await prisma.role.findUnique({ where: { name: userRole } });
      if (role && (role as any)[permissionField] === true) { next(); return; }
      res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    } catch {
      res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
};
