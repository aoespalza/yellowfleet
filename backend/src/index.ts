import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
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

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://192.168.50.85:5173', 'http://192.168.50.85:3000', 'http://192.168.126.194:5173', 'http://192.168.126.194:3000'],
    credentials: true,
  })
);
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


// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await connectDatabase();

  // Programar notificaciones automáticas - todos los días a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Ejecutando verificaciones de notificaciones automáticas...');
    try {
      const result = await notificationService.runAllChecks();
      console.log('[CRON] Resultado de notificaciones:', {
        contracts: result.contracts.sent,
        leasing: result.leasing.sent,
        documents: result.documents.sent,
        workOrders: result.workOrders.sent
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
