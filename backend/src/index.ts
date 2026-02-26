import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDatabase } from './infrastructure/database/prisma';



// Routes
import FleetRoutes from './interfaces/http/routes/FleetRoutes';
import ContractsRoutes from './interfaces/http/routes/ContractsRoutes';
import WorkshopRoutes from './interfaces/http/routes/WorkshopRoutes';
import FinanceRoutes from './interfaces/http/routes/FinanceRoutes';
import AuthRoutes from './interfaces/http/routes/AuthRoutes';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://192.168.50.85:5173', 'http://192.168.50.85:3000'],
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


// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(console.error);
