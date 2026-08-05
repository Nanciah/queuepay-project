import express from 'express';
import { isClient, auth } from '../middleware/auth.js';
import * as ticketController from '../controllers/ticketController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as walletController from '../controllers/walletController.js';

const router = express.Router();

// 🔥 Routes protégées (client uniquement)
router.use(isClient);

// Gestion des tickets
router.post('/tickets', ticketController.createTicket);
router.get('/tickets', ticketController.getMyTickets);
router.get('/tickets/:id', ticketController.getTicketById);
router.put('/tickets/:id/cancel', ticketController.cancelTicket);

// Gestion du portefeuille
router.get('/wallet', walletController.getWalletBalance);
router.post('/wallet/deposit', paymentController.initiateDeposit);
router.get('/wallet/transactions', walletController.getTransactions);
router.post('/wallet/withdraw', walletController.requestWithdrawal);

// Paiements
router.post('/payments/ticket', paymentController.payTicket);
router.get('/payments/status/:transactionId', paymentController.getPaymentStatus);

// Suivi en temps réel
router.get('/tracking/:ticketId', ticketController.getTicketStatus);

// Routes publiques (authentification optionnelle)
const publicRouter = express.Router();
publicRouter.get('/companies', ticketController.getCompanies);
publicRouter.get('/services', ticketController.getServices);
publicRouter.get('/services/:id/queue', ticketController.getQueueStatus);

export default { protected: router, public: publicRouter };