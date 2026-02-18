import express from 'express';
import FleetRoutes from './routes/FleetRoutes';
import ContractsRoutes from './routes/ContractsRoutes';
import WorkshopRoutes from './routes/WorkshopRoutes';
import FinanceRoutes from './routes/FinanceRoutes';

const app = express();

app.use(express.json());

app.use('/api', FleetRoutes);
app.use('/api', ContractsRoutes);
app.use('/api', WorkshopRoutes);
app.use('/api', FinanceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
