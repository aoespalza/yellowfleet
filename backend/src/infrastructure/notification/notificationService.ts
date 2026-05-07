import { PrismaClient } from '@prisma/client';
import { emailService } from '../../infrastructure/email/emailService';

// Cliente directo sin el wrapper RLS — el servicio de notificaciones es un proceso
// del sistema que no tiene contexto de usuario y debe bypassear RLS.
const prisma = new PrismaClient();

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

  // ============ RESUMEN DIARIO UNIFICADO ============

  private async gatherExpiringContracts(config: any): Promise<any[]> {
    if (!config.contractsEnabled) return [];
    const now = new Date();
    const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return prisma.contract.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now, lte: threshold } },
      include: { assignments: { include: { machine: true } } },
      orderBy: { endDate: 'asc' }
    });
  }

  private async gatherPendingLeasingPayments(config: any): Promise<any[]> {
    if (!config.leasingEnabled) return [];
    const now = new Date();
    const leasings = await prisma.leasing.findMany({
      where: { status: 'ACTIVE' },
      include: { machine: true, payments: true }
    });
    return leasings
      .map(l => ({ ...l, pendingPayments: l.payments.filter((p: any) => p.status === 'PENDING' && new Date(p.dueDate) < now) }))
      .filter(l => l.pendingPayments.length > 0);
  }

  private async gatherExpiringDocuments(config: any): Promise<Array<{ machine: any; expired: any[]; expiring: any[] }>> {
    if (!config.documentsEnabled) return [];
    const now = new Date();
    const targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const allDocs = await prisma.legalDocument.findMany({
      where: { expirationDate: { lte: targetDate, not: null } },
      include: { machine: true }
    });
    const byMachine: Record<string, { machine: any; expired: any[]; expiring: any[] }> = {};
    for (const doc of allDocs.filter(d => d.expirationDate)) {
      if (!byMachine[doc.machineId]) byMachine[doc.machineId] = { machine: doc.machine, expired: [], expiring: [] };
      if (new Date(doc.expirationDate!) < now) byMachine[doc.machineId].expired.push(doc);
      else byMachine[doc.machineId].expiring.push(doc);
    }
    return Object.values(byMachine);
  }

  private async gatherPendingWorkOrders(config: any): Promise<any[]> {
    if (!config.workshopEnabled) return [];
    return prisma.workOrder.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: { machine: true },
      orderBy: { entryDate: 'asc' }
    });
  }

  private async gatherMaintenanceDue(config: any): Promise<{ critical: any[]; warning: any[] }> {
    if (!config.workshopEnabled) return { critical: [], warning: [] };
    const machines = await prisma.machine.findMany({
      where: { maintenanceIntervalHours: { not: null }, status: { not: 'INACTIVE' } }
    });
    return {
      critical: machines.filter(m => (m.hoursSinceLastMaintenance || 0) >= (m.maintenanceIntervalHours || Infinity)),
      warning: machines.filter(m => {
        const pct = (m.hoursSinceLastMaintenance || 0) / (m.maintenanceIntervalHours || 1);
        return pct >= 0.8 && pct < 1.0;
      })
    };
  }

  private async gatherPendingEquipment(config: any): Promise<any[]> {
    if (!config.equipmentEnabled) return [];
    const operators = await prisma.operator.findMany({ where: { isActive: true }, include: { job: true } });
    const result = [];
    for (const operator of operators) {
      const delivered = await prisma.operatorEquipment.findMany({ where: { operatorId: operator.id }, select: { equipmentId: true } });
      const deliveredIds = new Set(delivered.map(e => e.equipmentId));
      const allEquipment = await prisma.equipment.findMany({ where: { isActive: true } });
      let relevant = allEquipment;
      if (operator.jobId && operator.job) {
        const allowedCategories = (operator.job as any).equipmentCategories || [];
        relevant = allEquipment.filter(eq => allowedCategories.includes(eq.category));
      }
      const pending = relevant
        .filter(eq => !deliveredIds.has(eq.id))
        .map(eq => ({ equipmentId: eq.id, equipmentName: eq.name, category: eq.category }));
      if (pending.length > 0) result.push({ operator, pendingItems: pending });
    }
    return result;
  }

  private generateSummaryHtml(data: {
    contracts: any[];
    leasings: any[];
    documents: Array<{ machine: any; expired: any[]; expiring: any[] }>;
    workOrders: any[];
    maintenance: { critical: any[]; warning: any[] };
    equipment: any[];
  }): string {
    const today = new Date().toLocaleDateString('es-CL');
    const now = new Date();

    let contractsSection = '';
    if (data.contracts.length > 0) {
      const rows = data.contracts.map(c => {
        const daysLeft = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const color = daysLeft <= 7 ? '#dc2626' : daysLeft <= 15 ? '#f59e0b' : '#16a34a';
        const bg = daysLeft <= 7 ? '#fef2f2' : '';
        return `<tr style="background:${bg}">
          <td style="padding:8px;border:1px solid #e5e7eb;">${c.code}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${c.customer || '-'}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${new Date(c.endDate).toLocaleDateString('es-CL')}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:${color};font-weight:bold;">${daysLeft}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${c.assignments?.length || 0} máq.</td>
        </tr>`;
      }).join('');
      contractsSection = `
        <h3 style="color:#1e40af;margin-top:24px;">📋 Contratos por vencer (${data.contracts.length})</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#eff6ff;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Código</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Cliente</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Vence</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">Días</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Máquinas</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    let leasingSection = '';
    if (data.leasings.length > 0) {
      const rows = data.leasings.map(l => {
        const totalPending = l.pendingPayments.reduce((s: number, p: any) => s + p.amount, 0);
        return `<tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${l.machine.code}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${l.entity}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:bold;">${l.pendingPayments.length}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">$${totalPending.toLocaleString('es-CL')}</td>
        </tr>`;
      }).join('');
      leasingSection = `
        <h3 style="color:#991b1b;margin-top:24px;">💰 Cuotas de leasing pendientes (${data.leasings.length} contrato(s))</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#fef2f2;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Máquina</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Entidad</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">Cuotas pend.</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Total pendiente</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    let documentsSection = '';
    if (data.documents.length > 0) {
      const rows = data.documents.map(({ machine, expired, expiring }) => {
        const bg = expired.length > 0 ? '#fef2f2' : '';
        const expiredList = expired.map(d => {
          const daysAgo = Math.ceil((now.getTime() - new Date(d.expirationDate).getTime()) / (1000 * 60 * 60 * 24));
          return `🔴 ${d.type} (vencido hace ${daysAgo} días)`;
        }).join('<br>');
        const expiringList = expiring.map(d => {
          const daysLeft = Math.ceil((new Date(d.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return `🟡 ${d.type} (${daysLeft} días)`;
        }).join('<br>');
        return `<tr style="background:${bg}">
          <td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">${machine.code}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${machine.brand} ${machine.model}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;font-size:12px;">${expiredList || '-'}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;font-size:12px;">${expiringList || '-'}</td>
        </tr>`;
      }).join('');
      documentsSection = `
        <h3 style="color:#92400e;margin-top:24px;">📄 Documentos de maquinaria (${data.documents.length} equipo(s))</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#fffbeb;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Código</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Máquina</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Vencidos</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Por vencer (30 días)</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    let workOrdersSection = '';
    if (data.workOrders.length > 0) {
      const rows = data.workOrders.slice(0, 20).map(wo => `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb;">${wo.machine?.code || '-'}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${wo.type}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${wo.status}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${wo.entryDate ? new Date(wo.entryDate).toLocaleDateString('es-CL') : '-'}</td>
      </tr>`).join('');
      workOrdersSection = `
        <h3 style="color:#1e3a5f;margin-top:24px;">🔧 Órdenes de trabajo pendientes (${data.workOrders.length})</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#eff6ff;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Máquina</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Tipo</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Estado</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Ingreso</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${data.workOrders.length > 20 ? `<p style="font-size:12px;color:#6b7280;">... y ${data.workOrders.length - 20} más</p>` : ''}`;
    }

    let maintenanceSection = '';
    const { critical, warning } = data.maintenance;
    if (critical.length > 0 || warning.length > 0) {
      const row = (m: any, type: 'critical' | 'warning') => {
        const hours = m.hoursSinceLastMaintenance || 0;
        const interval = m.maintenanceIntervalHours;
        const pct = Math.round((hours / interval) * 100);
        const color = type === 'critical' ? '#dc2626' : '#f59e0b';
        return `<tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${m.code}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;">${m.brand} ${m.model}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${hours.toFixed(0)} / ${interval}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:${color};font-weight:bold;">${pct}%</td>
          <td style="padding:8px;border:1px solid #e5e7eb;color:${color};font-weight:bold;">${type === 'critical' ? '🔴 VENCIDO' : '🟡 PRÓXIMO'}</td>
        </tr>`;
      };
      maintenanceSection = `
        <h3 style="color:#4c1d95;margin-top:24px;">⚙️ Mantenimiento preventivo (${critical.length} vencido(s), ${warning.length} próximo(s))</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f5f3ff;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Código</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Máquina</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Hrs usadas / Intervalo</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">% Uso</th>
            <th style="padding:8px;border:1px solid #e5e7eb;">Estado</th>
          </tr></thead>
          <tbody>
            ${critical.map(m => row(m, 'critical')).join('')}
            ${warning.map(m => row(m, 'warning')).join('')}
          </tbody>
        </table>`;
    }

    let equipmentSection = '';
    if (data.equipment.length > 0) {
      const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
          PROTECTION_CRANIAL: 'Prot. Craneana', PROTECTION_HANDS: 'Prot. Manos',
          PROTECTION_FEET: 'Prot. Pies', PROTECTION_VISUAL: 'Prot. Visual',
          PROTECTION_RESPIRATORY: 'Prot. Respiratoria', VEST: 'Chalecos',
          PROTECTION_HEARING: 'Prot. Auditiva', CLOTHING: 'Ropa', OTHER: 'Otros'
        };
        return labels[cat] || cat;
      };
      const totalPending = data.equipment.reduce((s, op) => s + op.pendingItems.length, 0);
      const rows = data.equipment.map(({ operator, pendingItems }) => `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb;">${operator.name}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${(operator.job as any)?.name || 'Sin cargo'}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:12px;">${pendingItems.map((item: any) => `${item.equipmentName} (${getCategoryLabel(item.category)})`).join(', ')}</td>
      </tr>`).join('');
      equipmentSection = `
        <h3 style="color:#701a75;margin-top:24px;">👕 Dotación pendiente (${data.equipment.length} operador(es), ${totalPending} ítem(s))</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#fdf4ff;">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Operador</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Cargo</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Elementos pendientes</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;color:#111827;background:#f9fafb;padding:0;margin:0;">
        <div style="max-width:820px;margin:0 auto;background:#ffffff;">
          <div style="background:#f59e0b;padding:24px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;">🟡 YellowFleet — Resumen Diario</h1>
            <p style="color:#fffbeb;margin:8px 0 0 0;">${today}</p>
          </div>
          <div style="padding:24px;">
            ${contractsSection}
            ${leasingSection}
            ${documentsSection}
            ${workOrdersSection}
            ${maintenanceSection}
            ${equipmentSection}
            <p style="margin-top:32px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;padding-top:16px;">
              Resumen generado automáticamente a las 8:00 AM — Sistema de Gestión de Flota YellowFleet
            </p>
          </div>
        </div>
      </body></html>`;
  }

  async sendDailySummary(): Promise<{ sent: number; errors: string[]; counts: Record<string, number> }> {
    const result = { sent: 0, errors: [] as string[], counts: {} as Record<string, number> };

    try {
      const config = await this.getNotificationConfig();
      const emails = this.parseEmails(config.notificationEmail);
      if (emails.length === 0) {
        result.errors.push('No hay destinatarios configurados');
        return result;
      }

      const [contracts, leasings, documents, workOrders, maintenance, equipment] = await Promise.all([
        this.gatherExpiringContracts(config),
        this.gatherPendingLeasingPayments(config),
        this.gatherExpiringDocuments(config),
        this.gatherPendingWorkOrders(config),
        this.gatherMaintenanceDue(config),
        this.gatherPendingEquipment(config),
      ]);

      result.counts = {
        contracts: contracts.length,
        leasing: leasings.length,
        documents: documents.reduce((s, d) => s + d.expired.length + d.expiring.length, 0),
        workOrders: workOrders.length,
        maintenance: maintenance.critical.length + maintenance.warning.length,
        equipment: equipment.reduce((s, op) => s + op.pendingItems.length, 0),
      };

      const hasContent = Object.values(result.counts).some(v => v > 0);
      if (!hasContent) {
        console.log('[NotificationService] No hay alertas pendientes hoy, no se envía email');
        return result;
      }

      const html = this.generateSummaryHtml({ contracts, leasings, documents, workOrders, maintenance, equipment });
      const today = new Date().toLocaleDateString('es-CL');
      const totalItems = Object.values(result.counts).reduce((a, b) => a + b, 0);

      for (const email of emails) {
        const emailResult = await emailService.sendEmail({
          to: email,
          subject: `🟡 YellowFleet — Resumen diario ${today} (${totalItems} alertas)`,
          html,
        });
        if (emailResult.success) {
          result.sent++;
          console.log(`[NotificationService] Resumen diario enviado a ${email}`);
        } else {
          result.errors.push(`Error enviando a ${email}: ${emailResult.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Error: ${error.message}`);
    }

    return result;
  }

  async runAllChecks(): Promise<{
    contracts: NotificationResult;
    leasing: NotificationResult;
    documents: NotificationResult;
    workOrders: NotificationResult;
    equipment: NotificationResult;
    maintenance: NotificationResult;
    summary: { sent: number; errors: string[]; counts: Record<string, number> };
  }> {
    const summary = await this.sendDailySummary();
    const makeResult = (type: string, count: number): NotificationResult => ({
      type, count, sent: 0, errors: []
    });
    return {
      contracts: makeResult('contracts_expiring', summary.counts.contracts || 0),
      leasing: makeResult('leasing_pending', summary.counts.leasing || 0),
      documents: makeResult('documents_expiring', summary.counts.documents || 0),
      workOrders: makeResult('workorders_pending', summary.counts.workOrders || 0),
      equipment: makeResult('equipment_pending', summary.counts.equipment || 0),
      maintenance: makeResult('maintenance_due', summary.counts.maintenance || 0),
      summary,
    };
  }

  async checkMaintenanceDue(): Promise<NotificationResult> {
    const result: NotificationResult = { type: 'maintenance_due', count: 0, sent: 0, errors: [] };
    try {
      const config = await this.getNotificationConfig();
      const emails = this.parseEmails(config.notificationEmail);
      if (!config.workshopEnabled || emails.length === 0) return result;

      const machines = await prisma.machine.findMany({
        where: { maintenanceIntervalHours: { not: null }, status: { not: 'INACTIVE' } }
      });

      const critical = machines.filter(m =>
        (m.hoursSinceLastMaintenance || 0) >= (m.maintenanceIntervalHours || Infinity)
      );
      const warning = machines.filter(m => {
        const pct = (m.hoursSinceLastMaintenance || 0) / (m.maintenanceIntervalHours || 1);
        return pct >= 0.8 && pct < 1.0;
      });

      if (critical.length === 0 && warning.length === 0) return result;
      result.count = critical.length + warning.length;

      for (const email of emails) {
        const emailResult = await emailService.sendEmail({
          to: email,
          subject: `🔧 Alerta mantenimiento: ${critical.length} vencido(s), ${warning.length} próximo(s)`,
          html: this.getMaintenanceDueEmailHtml(critical, warning)
        });
        if (emailResult.success) result.sent++;
        else result.errors.push(`Error: ${emailResult.message}`);
      }
      return result;
    } catch (error: any) {
      result.errors.push(`Error: ${error.message}`);
      return result;
    }
  }

  private getMaintenanceDueEmailHtml(critical: any[], warning: any[]): string {
    const row = (m: any, type: 'critical' | 'warning') => {
      const hours = m.hoursSinceLastMaintenance || 0;
      const interval = m.maintenanceIntervalHours;
      const pct = Math.round((hours / interval) * 100);
      const color = type === 'critical' ? '#dc2626' : '#f59e0b';
      return `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb;">${m.code}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;">${m.brand} ${m.model}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${hours.toFixed(0)} / ${interval}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:${color};font-weight:bold;">${pct}%</td>
        <td style="padding:8px;border:1px solid #e5e7eb;color:${color};font-weight:bold;">${type === 'critical' ? '🔴 VENCIDO' : '🟡 PRÓXIMO'}</td>
      </tr>`;
    };
    return `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
      <h1 style="color:#f59e0b;">🔧 Alerta de Mantenimiento Preventivo</h1>
      <p><strong>Máquinas con mantenimiento vencido:</strong> ${critical.length} &nbsp;|&nbsp; <strong>Próximas a vencer (≥80%):</strong> ${warning.length}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Código</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Máquina</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Hrs usadas / Intervalo</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">% Uso</th>
          <th style="padding:8px;border:1px solid #e5e7eb;">Estado</th>
        </tr></thead>
        <tbody>
          ${critical.map(m => row(m, 'critical')).join('')}
          ${warning.map(m => row(m, 'warning')).join('')}
        </tbody>
      </table>
      <p style="margin-top:16px;color:#6b7280;font-size:12px;">Sistema de Gestión de Flota - YellowFleet</p>
    </div>`;
  }

  // ============ DOTACIÓN PENDIENTE ============
  
  async checkPendingEquipment(): Promise<NotificationResult> {
    const result: NotificationResult = { type: 'equipment_pending', count: 0, sent: 0, errors: [] };
    
    try {
      const config = await this.getNotificationConfig();
      const emails = this.parseEmails(config.notificationEmail);
      if (!config.equipmentEnabled || emails.length === 0) {
        return { ...result, errors: ['Notificaciones de dotación deshabilitadas'] };
      }

      // Obtener todos los operadores activos
      const operators = await prisma.operator.findMany({
        where: { isActive: true },
        include: { job: true }
      });

      const operatorsWithPending: Array<{
        operator: any;
        pendingItems: Array<{ equipmentId: string; equipmentName: string; category: string }>;
      }> = [];

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
            category: eq.category
          }));

        if (pending.length > 0) {
          operatorsWithPending.push({ operator, pendingItems: pending });
        }
      }

      if (operatorsWithPending.length > 0) {
        result.count = operatorsWithPending.reduce((sum, op) => sum + op.pendingItems.length, 0);
        
        for (const email of emails) {
          const emailResult = await emailService.sendEmail({
            to: email,
            subject: `👕 Dotación pendiente: ${operatorsWithPending.length} operador(es)`,
            html: this.getPendingEquipmentEmailHtml(operatorsWithPending)
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

  private getPendingEquipmentEmailHtml(operatorsWithPending: Array<{
    operator: any;
    pendingItems: Array<{ equipmentId: string; equipmentName: string; category: string }>;
  }>): string {
    const getCategoryLabel = (cat: string) => {
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
      return labels[cat] || cat;
    };

    const totalPending = operatorsWithPending.reduce((sum, op) => sum + op.pendingItems.length, 0);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #9c27b0;">👕 Dotación Pendiente por Cargo</h1>
        <p><strong>Total operadores con dotación pendiente:</strong> ${operatorsWithPending.length}</p>
        <p><strong>Total elementos pendientes:</strong> ${totalPending}</p>
        
        ${operatorsWithPending.map(({ operator, pendingItems }) => `
          <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0;">${operator.name} ${operator.job ? `- ${(operator.job as any).name}` : '- Sin cargo'}</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${pendingItems.map(item => `
                <li><strong>${item.equipmentName}</strong> (${getCategoryLabel(item.category)})</li>
              `).join('')}
            </ul>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
              ${pendingItems.length} elemento(s) pendiente(s)
            </p>
          </div>
        `).join('')}
        
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Este email se envía diariamente a las 8:00 AM<br>
          Sistema de Gestión de Flota - YellowFleet
        </p>
      </div>
    `;
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
