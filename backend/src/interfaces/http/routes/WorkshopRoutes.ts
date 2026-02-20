import { Router } from 'express';
import { WorkshopController } from '../controllers/WorkshopController';
import { CreateWorkOrder } from '../../../application/workshop/CreateWorkOrder';
import { CloseWorkOrder } from '../../../application/workshop/CloseWorkOrder';
import { ListWorkOrdersByMachine } from '../../../application/workshop/ListWorkOrdersByMachine';
import { PrismaWorkOrderRepository } from '../../../infrastructure/repositories/PrismaWorkOrderRepository';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { upload } from '../../../infrastructure/upload/multer';
import path from 'path';
import { prisma } from '../../../infrastructure/database/prisma';

const workOrderRepository = new PrismaWorkOrderRepository();

const createWorkOrder = new CreateWorkOrder(workOrderRepository);
const closeWorkOrder = new CloseWorkOrder(workOrderRepository);
const listWorkOrdersByMachine = new ListWorkOrdersByMachine(workOrderRepository);

const workshopController = new WorkshopController();

const router = Router();

// Rutas públicas (solo lectura)
router.get('/', (req, res) => workshopController.list(req, res));

// Rutas protegidas (requieren autenticación y rol ADMIN o MANAGER)
router.post('/', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.create(req, res));

// Logs - debe venir antes de :id
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    
    const logs = await prisma.workOrderLog.findMany({
      where: { workOrderId: id },
      orderBy: { date: 'desc' },
      include: {
        workOrder: {
          include: {
            machine: {
              select: { code: true }
            }
          }
        }
      }
    });

    // Include work order info in response
    const logsWithInfo = logs.map(log => ({
      id: log.id,
      workOrderId: log.workOrderId,
      machineCode: log.workOrder.machine.code,
      date: log.date,
      description: log.description,
      fileUrl: log.fileUrl,
      fileName: log.fileName,
      fileType: log.fileType,
      createdAt: log.createdAt,
    }));

    res.status(200).json(logsWithInfo);
  } catch (error) {
    console.error('Error fetching logs:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

// Ruta para subir archivos a los logs - DEBE estar antes de /:id/logs
router.post('/:id/logs/upload', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
      return;
    }

    // Check if work order exists
    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) {
      res.status(404).json({ error: 'Work order not found' });
      return;
    }

    // Construct file URL (serve from /uploads folder)
    const fileUrl = `/uploads/${file.filename}`;
    const fileName = file.originalname;
    const fileType = file.mimetype;

    const log = await prisma.workOrderLog.create({
      data: {
        workOrderId: id,
        description: description || '',
        fileUrl,
        fileName,
        fileType,
        date: new Date(),
      },
    });

    res.status(201).json({
      id: log.id,
      workOrderId: log.workOrderId,
      date: log.date,
      description: log.description,
      fileUrl: log.fileUrl,
      fileName: log.fileName,
      fileType: log.fileType,
      createdAt: log.createdAt,
    });
  } catch (error) {
    console.error('Error uploading log:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
});

router.post('/:id/logs', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.addLog(req, res));

router.patch('/:id/close', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.close(req, res));
router.patch('/:id/status', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.updateStatus(req, res));
router.put('/:id', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.update(req, res));
router.delete('/:id', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.delete(req, res));

// Logs delete - debe venir después de :id
router.delete('/logs/:logId', authenticateToken, authorizeRole('ADMIN', 'MANAGER'), (req, res) => workshopController.deleteLog(req, res));

export default router;
