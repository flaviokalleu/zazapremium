import express from 'express';
import  authMiddleware  from '../middleware/authMiddleware.js';
import { tenantMiddleware } from '../middleware/tenantMiddleware.js';
import {
  getSessionIntegrations,
  getSessionIntegrationById,
  createSessionIntegration,
  updateSessionIntegration,
  deleteSessionIntegration,
  toggleSessionIntegration,
  getIntegrationsBySession
} from '../controllers/sessionIntegrationController.js';

const router = express.Router();

// Middleware de autenticação e tenant para todas as rotas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rotas para session integrations
router.get('/', getSessionIntegrations);
router.get('/:id', getSessionIntegrationById);
router.post('/', createSessionIntegration);
router.put('/:id', updateSessionIntegration);
router.delete('/:id', deleteSessionIntegration);
router.patch('/:id/toggle', toggleSessionIntegration);

// Rota especial para buscar integrações de uma sessão específica
router.get('/session/:sessionId', getIntegrationsBySession);

export default router;
