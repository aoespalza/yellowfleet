import { Router } from 'express';
import { JobUseCases } from '../../../application/job/JobUseCases';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();
const jobUseCases = new JobUseCases();

// GET /api/jobs - Listar todos los cargos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobs = await jobUseCases.listJobs();
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/:id - Obtener cargo por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await jobUseCases.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Cargo no encontrado' });
    }
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/machine-type/:type - Cargos que pueden operar un tipo de máquina
router.get('/machine-type/:type', authenticateToken, async (req, res) => {
  try {
    const jobs = await jobUseCases.getJobsByMachineType(req.params.type as any);
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/jobs/equipment-category/:category - Cargos que reciben una categoría de EPP
router.get('/equipment-category/:category', authenticateToken, async (req, res) => {
  try {
    const jobs = await jobUseCases.getJobsByEquipmentCategory(req.params.category as any);
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jobs - Crear nuevo cargo
router.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const job = await jobUseCases.createJob(req.body);
    res.status(201).json(job);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/jobs/:id - Actualizar cargo
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const job = await jobUseCases.updateJob(req.params.id, req.body);
    res.json(job);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/jobs/:id - Eliminar cargo (soft delete)
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
  try {
    await jobUseCases.deleteJob(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;