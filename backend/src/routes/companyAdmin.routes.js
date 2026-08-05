import express from 'express';
import { isCompanyAdmin } from '../middleware/auth.js';
import * as serviceController from '../controllers/serviceController.js';
import * as agentController from '../controllers/agentController.js';
import * as statsController from '../controllers/statsController.js';

const router = express.Router();

// 🔥 Toutes les routes Company Admin sont protégées
router.use(isCompanyAdmin);

// Gestion des services
router.post('/services', serviceController.createService);
router.get('/services', serviceController.getCompanyServices);
router.get('/services/:id', serviceController.getServiceById);
router.put('/services/:id', serviceController.updateService);
router.delete('/services/:id', serviceController.deleteService);

// Gestion des agents
router.post('/agents', agentController.createAgent);
router.get('/agents', agentController.getCompanyAgents);
router.get('/agents/:id', agentController.getAgentById);
router.put('/agents/:id', agentController.updateAgent);
router.delete('/agents/:id', agentController.deleteAgent);
router.put('/agents/:id/assign-service', agentController.assignServiceToAgent);
router.put('/agents/:id/unassign-service', agentController.unassignServiceFromAgent);

// Gestion des files d'attente
router.get('/queues', serviceController.getCompanyQueues);
router.get('/queues/:serviceId/status', serviceController.getQueueStatus);

// Statistiques de l'entreprise
router.get('/stats/company', statsController.getCompanyStats);
router.get('/stats/daily', statsController.getDailyStats);
router.get('/stats/agents', statsController.getAgentsPerformance);

export default router;