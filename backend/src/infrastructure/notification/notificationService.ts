import { prisma } from '../../infrastructure/database/prisma';
import { emailService } from '../../infrastructure/email/emailService';

interface NotificationResult {
  type: string;
  count: number;
  sent: number;
  errors: string[];
}

class NotificationService {
  
  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    return emailService.sendEmail({
      to,
      subject: '🔔 Prueba de notificaciones - YellowFleet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">🟡 YellowFleet - Prueba de Notificaciones</h1>
          <p>Este es un email de prueba del sistema de notificaciones.</p>
          <p><strong>Estado:</strong> ✅ Configuración correcta</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Sistema de Gestión de Flota - YellowFleet
          </p>
        </div>
      `
    });
  }

  async checkExpiringContracts(): Promise<NotificationResult> {
    const result: NotificationResult = { type: 'contracts_expiring', count: 0, sent: 0, errors: [] };
    
    try {
      const config = await this.getNotificationConfig();
      const emails = this.parseEmails(config.notificationEmail);
      if (!config.contractsEnabled || emails.length === 0) {
        return { ...result, errors: ['Notificaciones de contratos deshabilitadas'] };
      }

      const now = new Date();
      const daysBeforeExpire = [30, 15, 7];

      for (const days of daysBeforeExpire) {
        const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        const contracts = await prisma.contract.findMany({
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              lte: new Date(targetDate.setHours(23, 59, 59, 999))
            }
          },
          include: {
            assignments: {
              include: { machine: true }
            }
          }
        });

        for (const contract of contracts) {
          result.count++;
          const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft === days) {
            // Enviar a todos los destinatarios
            for (const email of emails) {
              const emailResult = await emailService.sendEmail({
                to: email,
                subject: `⚠️ Contrato por vencer: ${contract.code}`,
                html: this.getContractExpiringEmailHtml(contract, daysLeft)
              });
              
              if (emailResult.success) {
                result.sent++;
              } else {
                result.errors.push(`Error: ${emailResult.message}`);
              }
            }
          }
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  async checkPendingLeasingPayments(): Promise<NotificationResult> {
    const result: NotificationResult = { type: 'leasing_pending', count: 0, sent: 0, errors: [] };
    
    try {
      const config = await this.getNotificationConfig();
      const emails = this.parseEmails(config.notificationEmail);
      if (!config.leasingEnabled || emails.length === 0) {
        return { ...result, errors: ['Notificaciones de leasing deshabilitadas'] };
      }

      const now = new Date();

      const leasings = await prisma.leasing.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          machine: true,
          payments: true
        }
      });

      for (const leasing of leasings) {
        const pendingPayments = leasing.payments.filter((p: any) => 
          p.status === 'PENDING' && 
          new Date(p.dueDate) < now
        );

        if (pendingPayments.length > 0) {
          result.count += pendingPayments.length;
          
          for (const email of emails) {
            const emailResult = await emailService.sendEmail({
              to: email,
              subject: `💰 Cuota(s) de leasing pendiente(s): ${leasing.machine.code}`,
              html: this.getLeasingPendingEmailHtml(leasing, pendingPayments)
            });
            
            if (emailResult.success) {
              result.sent++;
            } else {
              result.errors.push(`Error: ${emailResult.message}`);
            }
          }
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  async checkExpiringDocuments(): Promise<NotificationResult> {
    const result: NotificationResult = { type: 'documents_expiring', count: 0, sent: 0, errors: [] };
    
    try {
      const config = await this.getNotificationConfig();
      const emails = this.parseEmails(config.notificationEmail);
      if (!config.documentsEnabled || emails.length === 0) {
        return { ...result, errors: ['Notificaciones de documentos deshabilitadas'] };
      }

      const now = new Date();
      const daysThreshold = 30;
      const targetDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

      // Incluir documentos vencidos y por vencer (hasta 30 días)
      const allDocuments = await prisma.legalDocument.findMany({
        where: {
          expirationDate: {
            lte: targetDate,
            not: null
          }
        },
        include: {
          machine: true
        }
      });

      // Filtrar documentos válidos y separar en vencidos y por vencer
      const documents = allDocuments.filter(d => d.expirationDate !== null);
      const expiredDocuments = documents.filter(d => d.expirationDate && new Date(d.expirationDate) < now);
      const expiringDocuments = documents.filter(d => d.expirationDate && new Date(d.expirationDate) >= now);

      const documentsByMachine: Record<string, { machine: any, expired: any[], expiring: any[] }> = {};
      for (const doc of documents) {
        if (!doc.expirationDate) continue;
        if (!documentsByMachine[doc.machineId]) {
          documentsByMachine[doc.machineId] = { machine: doc.machine, expired: [], expiring: [] };
        }
        if (new Date(doc.expirationDate) < now) {
          documentsByMachine[doc.machineId].expired.push(doc);
        } else {
          documentsByMachine[doc.machineId].expiring.push(doc);
        }
      }

      for (const data of Object.values(documentsByMachine)) {
        const totalDocs = data.expired.length + data.expiring.length;
        result.count += totalDocs;
        
        for (const email of emails) {
          const emailResult = await emailService.sendEmail({
            to: email,
            subject: totalDocs > 0 && data.expired.length > 0 
              ? `⚠️ Documentos vencidos: ${data.machine.code}` 
              : `📄 Documentos por vencer: ${data.machine.code}`,
            html: this.getDocumentsExpiringEmailHtml(data.machine, data.expired, data.expiring)
          });
          
          if (emailResult.success) {
            result.sent++;
          } else {
            result.errors.push(`Error: ${emailResult.message}`);
          }
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  async checkPendingWorkOrders(): Promise<NotificationResult> {
    const result: NotificationResult = { type: 'workorders_pending', count: 0, sent: 0, errors: [] };
    
    try {
      const config = await this.getNotificationConfig();
      const emails = this.parseEmails(config.notificationEmail);
      if (!config.workshopEnabled || emails.length === 0) {
        return { ...result, errors: ['Notificaciones de taller deshabilitadas'] };
      }

      const workOrders = await prisma.workOrder.findMany({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        include: {
          machine: true
        },
        orderBy: { entryDate: 'asc' }
      });

      if (workOrders.length > 0) {
        result.count = workOrders.length;
        
        for (const email of emails) {
          const emailResult = await emailService.sendEmail({
            to: email,
            subject: `🔧 Órdenes de trabajo pendientes: ${workOrders.length}`,
            html: this.getWorkOrdersPendingEmailHtml(workOrders)
          });
          
          if (emailResult.success) {
            result.sent++;
          } else {
            result.errors.push(`Error: ${emailResult.message}`);
          }
        }
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  async runAllChecks(): Promise<{
    contracts: NotificationResult;
    leasing: NotificationResult;
    documents: NotificationResult;
    workOrders: NotificationResult;
  }> {
    const results = await Promise.all([
      this.checkExpiringContracts(),
      this.checkPendingLeasingPayments(),
      this.checkExpiringDocuments(),
      this.checkPendingWorkOrders()
    ]);

    return {
      contracts: results[0],
      leasing: results[1],
      documents: results[2],
      workOrders: results[3]
    };
  }

  private async getNotificationConfig() {
    const config = await prisma.systemConfig.findFirst({
      where: { key: 'notification_config' }
    });
    
    if (config && config.value) {
      return JSON.parse(config.value as string);
    }
    
    return {
      notificationEmail: '',
      contractsEnabled: true,
      leasingEnabled: true,
      documentsEnabled: true,
      workshopEnabled: true
    };
  }

  // Parsea una cadena de emails separados por coma o punto y coma
  private parseEmails(emailString: string): string[] {
    if (!emailString) return [];
    return emailString
      .split(/[,;]/)
      .map(e => e.trim())
      .filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  }

  private getContractExpiringEmailHtml(contract: any, daysLeft: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">⚠️ Contrato por Vencer</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Codigo</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${contract.code}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Cliente</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${contract.customer}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Fecha Fin</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(contract.endDate).toLocaleDateString('es-CL')}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Dias Restantes</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb; color: ${daysLeft <= 7 ? '#dc2626' : '#f59e0b'};"><strong>${daysLeft} dias</strong></td></tr>
        </table>
        <p style="margin-top: 20px; color: #6b7280;">Maquinas asignadas: ${contract.assignments?.length || 0}</p>
      </div>
    `;
  }

  private getLeasingPendingEmailHtml(leasing: any, pendingPayments: any[]): string {
    const totalPending = pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">💰 Cuotas de Leasing Pendientes</h1>
        <p><strong>Maquina:</strong> ${leasing.machine.code}</p>
        <p><strong>Entidad:</strong> ${leasing.entity}</p>
        <p><strong>Total pendiente:</strong> $${totalPending.toLocaleString('es-CL')}</p>
        <p><strong>Cantidad de cuotas:</strong> ${pendingPayments.length}</p>
      </div>
    `;
  }

  private getDocumentsExpiringEmailHtml(machine: any, expiredDocuments: any[], expiringDocuments: any[]): string {
    const hasExpired = expiredDocuments.length > 0;
    const titleColor = hasExpired ? '#dc2626' : '#f59e0b';
    const titleEmoji = hasExpired ? '⚠️' : '📄';
    const titleText = hasExpired ? 'Documentos Vencidos' : 'Documentos por Vencer';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${titleColor};">${titleEmoji} ${titleText}</h1>
        <p><strong>Maquina:</strong> ${machine.code}</p>
        ${hasExpired ? `
        <h2 style="color: #dc2626;">⚠️ Vencidos (requieren atencion inmediata)</h2>
        <ul style="color: #dc2626;">
          ${expiredDocuments.length > 0 ? expiredDocuments.map((d: any) => {
            const expDate = d.expirationDate ? new Date(d.expirationDate) : null;
            if (!expDate) return '';
            const daysAgo = Math.ceil((new Date().getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));
            return `<li><strong>${d.type}</strong> - Vencio hace ${daysAgo} dias (${expDate.toLocaleDateString('es-CL')})</li>`;
          }).join('') : '<li>No hay documentos vencidos</li>'}
        </ul>
        ` : ''}
        ${expiringDocuments.length > 0 ? `
        <h2 style="color: #f59e0b;">Por Vencer (proximos 30 dias)</h2>
        <ul>
          ${expiringDocuments.map((d: any) => {
            const expDate = d.expirationDate ? new Date(d.expirationDate) : null;
            if (!expDate) return '';
            const daysLeft = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return `<li><strong>${d.type}</strong> - Vence: ${expDate.toLocaleDateString('es-CL')} (${daysLeft} dias)</li>`;
          }).join('')}
        </ul>
        ` : ''}
      </div>
    `;
  }

  private getWorkOrdersPendingEmailHtml(workOrders: any[]): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">🔧 Ordenes de Trabajo Pendientes</h1>
        <p><strong>Total de ordenes:</strong> ${workOrders.length}</p>
        <ul>
          ${workOrders.slice(0, 10).map((wo: any) => 
            `<li>${wo.machineCode} - ${wo.type} - ${wo.status} - Ingreso: ${new Date(wo.entryDate).toLocaleDateString('es-CL')}</li>`
          ).join('')}
        </ul>
        ${workOrders.length > 10 ? `<p>... y ${workOrders.length - 10} mas</p>` : ''}
      </div>
    `;
  }
}

export const notificationService = new NotificationService();
