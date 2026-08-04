import express from 'express';
import { isAgent } from '../middleware/auth.js';
import * as queueController from '../controllers/queueController.js';
import * as ticketController from '../controllers/ticketController.js';

const router = express.Router();

// 🔥 Toutes les routes Agent sont protégées
router.use(isAgent);

// Gestion de la file d'attente
router.get('/queue/:serviceId/status', queueController.getQueueStatus);
router.post('/queue/:serviceId/call-next', queueController.callNextTicket);
router.put('/tickets/:ticketId/complete', queueController.completeTicket);
router.put('/tickets/:ticketId/cancel', queueController.cancelTicket);
router.put('/tickets/:ticketId/call', queueController.callTicket);

// Gestion du guichet
router.post('/desk/status', queueController.updateDeskStatus);
router.get('/desk/status', queueController.getDeskStatus);
router.get('/tickets/current', queueController.getCurrentTicket);

// Gestion des pauses
router.post('/desk/break', queueController.startBreak);
router.post('/desk/resume', queueController.endBreak);

export default router;