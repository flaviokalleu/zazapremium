import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { tenantMiddleware } from '../middleware/tenantMiddleware.js';
import { 
  createQueueIntegration,
  updateQueueIntegration,
  deleteQueueIntegration,
  getQueueIntegrations,
  getQueueIntegrationById
} from '../controllers/queueIntegrationController.js';

const router = express.Router();

// Middleware de autenticação e tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rotas para integrações por fila
router.post('/', createQueueIntegration);
router.get('/', getQueueIntegrations);
router.get('/:id', getQueueIntegrationById);
router.put('/:id', updateQueueIntegration);
router.delete('/:id', deleteQueueIntegration);

export default router;
