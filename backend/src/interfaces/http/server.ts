import express from 'express';
import cors from 'cors';
import FleetRoutes from './routes/FleetRoutes';
import ContractsRoutes from './routes/ContractsRoutes';
import WorkshopRoutes from './routes/WorkshopRoutes';
import FinanceRoutes from './routes/FinanceRoutes';
import AuthRoutes from './routes/AuthRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', AuthRoutes);
app.use('/api', FleetRoutes);
app.use('/api', ContractsRoutes);
app.use('/api', WorkshopRoutes);
app.use('/api', FinanceRoutes);

// Log all routes
app._router.stack.forEach((r: any) => {
  if (r.route && r.route.path) {
    console.log(`Route: ${Object.keys(r.route.methods).join(', ').toUpperCase()} /api${r.route.path}`);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
