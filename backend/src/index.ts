import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './infrastructure/database/prisma';



// Routes
import FleetRoutes from './interfaces/http/routes/FleetRoutes';
import ContractsRoutes from './interfaces/http/routes/ContractsRoutes';
import WorkshopRoutes from './interfaces/http/routes/WorkshopRoutes';
import FinanceRoutes from './interfaces/http/routes/FinanceRoutes';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: 'http://localhost:5174',
    credentials: true,
  })
);
app.use(express.json());



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
