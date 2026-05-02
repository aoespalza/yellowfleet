import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma';
import { emailService } from '../../../infrastructure/email/emailService';
import { notificationService } from '../../../infrastructure/notification/notificationService';

export class NotificationController {

  async getConfig(req: Request, res: Response) {
    try {
      const notificationConfig = await prisma.systemConfig.findFirst({
        where: { key: 'notification_config' }
      });
      
      const smtpConfig = await prisma.systemConfig.findFirst({
        where: { key: 'smtp_config' }
      });
      
      let config: any = {
        notificationEmail: '',
        contractsEnabled: true,
        leasingEnabled: true,
        documentsEnabled: true,
        workshopEnabled: true,
        equipmentEnabled: true,
        host: '',
        port: 587,
        secure: false,
        user: '',
        password: '',
        from: ''
      };
      
      if (notificationConfig && notificationConfig.value) {
        const parsed = JSON.parse(notificationConfig.value as string);
        config = { ...config, ...parsed };
      }
      
      if (smtpConfig && smtpConfig.value) {
        const parsed = JSON.parse(smtpConfig.value as string);
        config = { ...config, ...parsed, password: '' };
      }
      
      return res.json(config);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async saveConfig(req: Request, res: Response) {
    try {
      console.log('[Notifications] saveConfig body:', req.body);
      const { notificationEmail, contractsEnabled, leasingEnabled, documentsEnabled, workshopEnabled, equipmentEnabled, host, port, secure, user, password, from } = req.body;

      // Validar emails de notificación (permite múltiples separados por coma o punto y coma)
      // Si no hay email, usar valor por defecto
      const emailValue = notificationEmail || '';
      let validEmails: string[] = [];
      
      if (emailValue.trim()) {
        const emails = emailValue.split(/[,;]/).map((e: string) => e.trim()).filter((e: string) => e);
        validEmails = emails.filter((e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
      }

      // Validar configuración SMTP - solo requiere password si es nuevo (no hay configuración previa)
      const existingSmtp = await prisma.systemConfig.findFirst({
        where: { key: 'smtp_config' }
      });
      
      if (host && user && !existingSmtp && !password) {
        return res.status(400).json({ error: 'Contraseña SMTP requerida para nueva configuración' });
      }

      const emailConfig = {
        host: host || '',
        port: port || 587,
        secure: secure === true || secure === 'true',
        user: user || '',
        password: password || '',
        from: from || user || ''
      };

      const notificationConfig = {
        notificationEmail,
        contractsEnabled: contractsEnabled !== false && contractsEnabled !== undefined,
        leasingEnabled: leasingEnabled !== false && leasingEnabled !== undefined,
        documentsEnabled: documentsEnabled !== false && documentsEnabled !== undefined,
        workshopEnabled: workshopEnabled !== false && workshopEnabled !== undefined,
        equipmentEnabled: equipmentEnabled !== false && equipmentEnabled !== undefined
      };

      // Guardar configuración de notificaciones
      await prisma.systemConfig.upsert({
        where: { key: 'notification_config' },
        update: { value: JSON.stringify(notificationConfig) },
        create: { key: 'notification_config', value: JSON.stringify(notificationConfig) }
      });

      // Guardar configuración SMTP
      await prisma.systemConfig.upsert({
        where: { key: 'smtp_config' },
        update: { value: JSON.stringify(emailConfig) },
        create: { key: 'smtp_config', value: JSON.stringify(emailConfig) }
      });

      await prisma.systemConfig.upsert({
        where: { key: 'email_config' },
        update: { value: JSON.stringify(emailConfig) },
        create: { key: 'email_config', value: JSON.stringify(emailConfig) }
      });

      return res.json({ success: true, message: 'Configuración guardada correctamente' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async testConnection(req: Request, res: Response) {
    try {
      const result = await emailService.testConnection();
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async sendTestEmail(req: Request, res: Response) {
    try {
      const { to } = req.body;
      
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return res.status(400).json({ error: 'Email destinatario inválido' });
      }

      const result = await notificationService.sendTestEmail(to);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async runNotifications(req: Request, res: Response) {
    try {
      const result = await notificationService.runAllChecks();
      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async checkContracts(req: Request, res: Response) {
    try {
      const result = await notificationService.checkExpiringContracts();
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async checkLeasing(req: Request, res: Response) {
    try {
      const result = await notificationService.checkPendingLeasingPayments();
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async checkDocuments(req: Request, res: Response) {
    try {
      const result = await notificationService.checkExpiringDocuments();
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async checkWorkOrders(req: Request, res: Response) {
    try {
      const result = await notificationService.checkPendingWorkOrders();
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async checkEquipment(req: Request, res: Response) {
    try {
      const result = await notificationService.checkPendingEquipment();
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
