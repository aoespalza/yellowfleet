import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import { connectDatabase } from './infrastructure/database/prisma';
import { notificationService } from './infrastructure/notification/notificationService';



// Routes
import FleetRoutes from './interfaces/http/routes/FleetRoutes';
import ContractsRoutes from './interfaces/http/routes/ContractsRoutes';
import WorkshopRoutes from './interfaces/http/routes/WorkshopRoutes';
import FinanceRoutes from './interfaces/http/routes/FinanceRoutes';
import AuthRoutes from './interfaces/http/routes/AuthRoutes';
import RoleRoutes from './interfaces/http/routes/RoleRoutes';
import NotificationRoutes from './interfaces/http/routes/NotificationRoutes';
import OperatorRoutes from './interfaces/http/routes/OperatorRoutes';
import EquipmentRoutes from './interfaces/http/routes/EquipmentRoutes';
import JobRoutes from './interfaces/http/routes/JobRoutes';

const app = express();
const PORT = process.env.PORT || 3000;
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? '*' 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://192.168.50.85:5173', 'http://192.168.50.85:3000', 'http://192.168.126.194:5173', 'http://192.168.126.194:3000'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', AuthRoutes);

// Business routes
app.use('/api/fleet', FleetRoutes);
app.use('/api/contracts', ContractsRoutes);
app.use('/api/workshop', WorkshopRoutes);
app.use('/api/finance', FinanceRoutes);
app.use('/api/roles', RoleRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/operators', OperatorRoutes);
app.use('/api/equipment', EquipmentRoutes);
app.use('/api/jobs', JobRoutes);


// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido en el cuerpo de la solicitud' });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Evitar crash por excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// Serve frontend static files in production (solo si el build existe en este contenedor)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }
}

async function start() {
  await connectDatabase();

  // Programar notificaciones automáticas - todos los días a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Ejecutando verificaciones de notificaciones automáticas...');
    try {
      const result = await notificationService.runAllChecks();
      console.log('[CRON] Resultado de notificaciones:', {
        emailsEnviados: result.summary.sent,
        alertas: result.summary.counts,
        errores: result.summary.errors
      });
    } catch (error) {
      console.error('[CRON] Error en notificaciones automáticas:', error);
    }
  });
  console.log('[CRON] Notificaciones programadas diariamente a las 8:00 AM');

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(console.error);
