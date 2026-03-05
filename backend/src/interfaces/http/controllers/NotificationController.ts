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
      const { notificationEmail, contractsEnabled, leasingEnabled, documentsEnabled, workshopEnabled, host, port, secure, user, password, from } = req.body;

      // Validar emails de notificación (permite múltiples separados por coma o punto y coma)
      if (!notificationEmail) {
        return res.status(400).json({ error: 'Email de notificación requerido' });
      }
      
      const emails = notificationEmail.split(/[,;]/).map((e: string) => e.trim()).filter((e: string) => e);
      const validEmails = emails.filter((e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
      if (validEmails.length === 0) {
        return res.status(400).json({ error: 'Al menos un email de notificación válido es requerido' });
      }

      // Validar configuración SMTP si se proporciona
      if (host && user) {
        if (!password) {
          return res.status(400).json({ error: 'Contraseña SMTP requerida' });
        }
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
        contractsEnabled: contractsEnabled !== false,
        leasingEnabled: leasingEnabled !== false,
        documentsEnabled: documentsEnabled !== false,
        workshopEnabled: workshopEnabled !== false
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
}
