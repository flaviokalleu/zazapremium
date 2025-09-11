import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  listIntegrations, createIntegration, updateIntegration, deleteIntegration,
  linkIntegrationTicket, unlinkIntegrationTicket, getIntegrationsByTicket,
  linkIntegrationQueue, unlinkIntegrationQueue, getIntegrationsByQueue,
  executeIntegration, testIntegration,
  createQueueIntegration, listQueueIntegrations, updateQueueIntegration, deleteQueueIntegration
} from '../controllers/integrationController.js';

const router = express.Router();

router.get('/', authMiddleware, listIntegrations);
router.post('/', authMiddleware, createIntegration);
router.put('/:id', authMiddleware, updateIntegration);
router.delete('/:id', authMiddleware, deleteIntegration);

router.post('/link-ticket', authMiddleware, linkIntegrationTicket);
router.post('/unlink-ticket', authMiddleware, unlinkIntegrationTicket);
router.get('/by-ticket/:ticketId', authMiddleware, getIntegrationsByTicket);

router.post('/link-queue', authMiddleware, linkIntegrationQueue);
router.post('/unlink-queue', authMiddleware, unlinkIntegrationQueue);
router.get('/by-queue/:queueId', authMiddleware, getIntegrationsByQueue);

// Execução e teste de integrações
router.post('/:integrationId/execute', authMiddleware, executeIntegration);
router.post('/:integrationId/test', authMiddleware, testIntegration);

// Rotas específicas para QueueIntegrations (Typebot)
router.post('/queue-integrations', authMiddleware, createQueueIntegration);
router.get('/queue-integrations/:queueId?', authMiddleware, listQueueIntegrations);
router.put('/queue-integrations/:id', authMiddleware, updateQueueIntegration);
router.delete('/queue-integrations/:id', authMiddleware, deleteQueueIntegration);

export default router;
