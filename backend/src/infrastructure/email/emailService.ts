import nodemailer, { Transporter, TestAccount } from 'nodemailer';
import { PrismaClient } from '@prisma/client';

// Cliente directo sin RLS — el email service es infraestructura del sistema,
// no debe correr bajo el contexto de ningún usuario.
const prisma = new PrismaClient();

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  async loadConfig(): Promise<EmailConfig | null> {
    try {
      const config = await prisma.systemConfig.findFirst({
        where: { key: 'email_config' }
      });
      
      if (config && config.value) {
        const parsed = JSON.parse(config.value as string);
        return {
          host: parsed.host,
          port: parseInt(parsed.port),
          secure: parsed.secure === true || parsed.secure === 'true',
          auth: {
            user: parsed.user,
            pass: parsed.password
          },
          from: parsed.from || parsed.user
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading email config:', error);
      return null;
    }
  }

  async configure(config: EmailConfig): Promise<void> {
    // name fija el hostname del EHLO — sin esto Docker envía EHLO [172.x.x.x]
    // y algunos servidores SMTP lo rechazan silenciosamente.
    const ehloName = config.from.includes('@') ? config.from.split('@')[1] : config.host;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      name: ehloName
    });
    this.isConfigured = true;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.loadConfig();
      
      if (!config) {
        return { success: false, message: 'No hay configuración de email guardada' };
      }

      await this.configure(config);
      
      const testResult = await this.transporter!.verify();
      
      if (testResult) {
        return { success: true, message: 'Conexión SMTP exitosa' };
      }
      
      return { success: false, message: 'Error al verificar conexión SMTP' };
    } catch (error: any) {
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      if (!this.isConfigured) {
        const config = await this.loadConfig();
        if (!config) {
          return { success: false, message: 'No hay configuración de email' };
        }
        await this.configure(config);
      }

      const config = await this.loadConfig();
      const from = config?.from || 'YellowFleet <noreply@yellowfleet.cl>';
      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      const info = await this.transporter!.sendMail({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '')
      });

      return { success: true, message: 'Email enviado exitosamente', messageId: info.messageId };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, message: `Error al enviar email: ${error.message}` };
    }
  }

  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

export const emailService = new EmailService();
