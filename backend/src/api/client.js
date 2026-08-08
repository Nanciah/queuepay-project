import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../middleware/auth.js';
import Entity from '../models/Entity.js';
import Service from '../models/Service.js';
import Ticket from '../models/Ticket.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import emailService from '../services/emailService.js';

const router = express.Router();

// ========== TEST ==========
router.get('/test', (req, res) => {
    res.json({ message: 'Client API is working!' });
});

// ========== COMPANIES ==========
router.get('/companies', auth, async (req, res) => {
    try {
        const companies = await Entity.findAll({
            where: { status: 'active' },
            attributes: ['id', 'name', 'description', 'address', 'city', 'phone', 'email', 'status']
        });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== SERVICES ==========
router.get('/services', auth, async (req, res) => {
    try {
        console.log('📋 Récupération de tous les services');
        const services = await Service.findAll({
            where: { is_active: true },
            include: [
                {
                    model: Entity,
                    as: 'entity',
                    attributes: ['id', 'name']
                }
            ],
            attributes: ['id', 'name', 'description', 'category', 'ticket_price', 'estimated_duration', 'is_active']
        });
        console.log(`✅ ${services.length} services trouvés`);
        res.json(services);
    } catch (error) {
        console.error('❌ Erreur récupération services:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== COMPANY SERVICES ==========
router.get('/companies/:companyId/services', auth, async (req, res) => {
    try {
        const { companyId } = req.params;
        const services = await Service.findAll({
            where: { 
                entity_id: companyId,
                is_active: true
            },
            attributes: ['id', 'name', 'description', 'category', 'ticket_price', 'estimated_duration', 'is_active']
        });
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== SINGLE SERVICE ==========
router.get('/services/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Service.findOne({
            where: { 
                id,
                is_active: true
            },
            include: [
                {
                    model: Entity,
                    as: 'entity',
                    attributes: ['id', 'name', 'address', 'city', 'phone', 'email']
                }
            ],
            attributes: ['id', 'name', 'description', 'category', 'ticket_price', 'estimated_duration', 'is_active']
        });
        
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }
        
        res.json(service);
    } catch (error) {
        console.error('❌ Erreur récupération service:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== WALLET ==========
router.get('/wallet', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`💰 Récupération wallet pour: ${userId}`);
        
        const transactions = await Transaction.findAll({
            where: { 
                user_id: userId,
                status: 'success'
            }
        });
        
        let balance = 0;
        transactions.forEach(t => {
            if (t.type === 'deposit') {
                balance += parseFloat(t.amount);
            } else if (t.type === 'ticket_purchase' || t.type === 'withdrawal') {
                balance -= parseFloat(t.amount);
            }
        });
        
        console.log(`💰 Solde calculé: ${balance} Ar`);
        res.json({ balance });
    } catch (error) {
        console.error('❌ Erreur wallet:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== DEPOSIT ==========
router.post('/wallet/deposit', auth, async (req, res) => {
    try {
        const { amount, method, phone_number } = req.body;
        const userId = req.user.id;

        console.log(`💰 Demande de dépôt: ${amount} Ar via ${method}`);

        const paymentMethodMap = {
            'mvola': 'mvola',
            'orange': 'orange_money',
            'orange_money': 'orange_money',
            'wallet': 'wallet',
        };
        
        const paymentMethod = paymentMethodMap[method] || method;

        if (!amount || amount < 1000) {
            return res.status(400).json({ error: 'Montant minimum : 1000 Ar' });
        }

        const reference = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const transaction = await Transaction.create({
            id: uuidv4(),
            user_id: userId,
            type: 'deposit',
            amount: amount,
            payment_method: paymentMethod,
            status: 'success',
            reference: reference,
            description: `Dépôt via ${method}`,
            provider: method,
            created_at: new Date(),
            updated_at: new Date()
        });

        const allTransactions = await Transaction.findAll({
            where: { 
                user_id: userId,
                status: 'success'
            }
        });

        let newBalance = 0;
        allTransactions.forEach(t => {
            if (t.type === 'deposit') {
                newBalance += parseFloat(t.amount);
            } else if (t.type === 'ticket_purchase' || t.type === 'withdrawal') {
                newBalance -= parseFloat(t.amount);
            }
        });

        console.log(`✅ Dépôt effectué: ${amount} Ar - Nouveau solde: ${newBalance} Ar`);

        res.status(201).json({
            message: 'Dépôt effectué avec succès',
            transaction: {
                id: transaction.id,
                amount: transaction.amount,
                type: transaction.type,
                status: transaction.status,
                payment_method: transaction.payment_method,
                reference: transaction.reference,
                description: transaction.description,
                created_at: transaction.created_at
            },
            newBalance: newBalance
        });

    } catch (error) {
        console.error('❌ Erreur dépôt:', error);
        res.status(500).json({ 
            error: 'Erreur lors du dépôt',
            details: error.message 
        });
    }
});

// ========== WITHDRAWAL ==========
router.post('/wallet/withdraw', auth, async (req, res) => {
    try {
        const { amount, method, phone_number } = req.body;
        const userId = req.user.id;

        console.log(`💰 Demande de retrait: ${amount} Ar via ${method}`);

        if (!amount || amount < 1000) {
            return res.status(400).json({ error: 'Montant minimum de retrait : 1000 Ar' });
        }

        if (amount > 20000) {
            return res.status(400).json({ error: 'Montant maximum de retrait : 20000 Ar par jour' });
        }

        const allTransactions = await Transaction.findAll({
            where: { 
                user_id: userId,
                status: 'success'
            }
        });

        let balance = 0;
        allTransactions.forEach(t => {
            if (t.type === 'deposit') {
                balance += parseFloat(t.amount);
            } else if (t.type === 'ticket_purchase' || t.type === 'withdrawal') {
                balance -= parseFloat(t.amount);
            }
        });

        if (balance < amount) {
            return res.status(400).json({ 
                error: `Solde insuffisant. Solde: ${balance} Ar, Retrait demandé: ${amount} Ar` 
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const withdrawalsToday = await Transaction.findAll({
            where: {
                user_id: userId,
                type: 'withdrawal',
                status: 'success',
                created_at: { [Op.gte]: today }
            }
        });
        const totalWithdrawnToday = withdrawalsToday.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        if (totalWithdrawnToday + amount > 20000) {
            return res.status(400).json({ 
                error: `Limite journalière de retrait dépassée. Déjà retiré: ${totalWithdrawnToday} Ar, Limite: 20000 Ar` 
            });
        }

        const reference = `WDR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const withdrawal = await Transaction.create({
            id: uuidv4(),
            user_id: userId,
            type: 'withdrawal',
            amount: amount,
            payment_method: method || 'wallet',
            status: 'success',
            reference: reference,
            description: `Retrait via ${method || 'wallet'}`,
            provider: method || 'wallet',
            created_at: new Date(),
            updated_at: new Date()
        });

        const updatedTransactions = await Transaction.findAll({
            where: { 
                user_id: userId,
                status: 'success'
            }
        });

        let newBalance = 0;
        updatedTransactions.forEach(t => {
            if (t.type === 'deposit') {
                newBalance += parseFloat(t.amount);
            } else if (t.type === 'ticket_purchase' || t.type === 'withdrawal') {
                newBalance -= parseFloat(t.amount);
            }
        });

        console.log(`✅ Retrait effectué: ${amount} Ar - Nouveau solde: ${newBalance} Ar`);

        res.status(201).json({
            message: 'Retrait effectué avec succès',
            withdrawal: {
                id: withdrawal.id,
                amount: withdrawal.amount,
                type: withdrawal.type,
                status: withdrawal.status,
                payment_method: withdrawal.payment_method,
                reference: withdrawal.reference,
                description: withdrawal.description,
                created_at: withdrawal.created_at
            },
            newBalance: newBalance
        });

    } catch (error) {
        console.error('❌ Erreur retrait:', error);
        res.status(500).json({ 
            error: 'Erreur lors du retrait',
            details: error.message 
        });
    }
});

// ========== WALLET TRANSACTIONS ==========
router.get('/wallet/transactions', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: 50
        });
        res.json(transactions);
    } catch (error) {
        console.error('❌ Erreur transactions:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== CREATE TICKET ==========
router.post('/tickets', auth, async (req, res) => {
    try {
        const { service_id, payment_method, phone_number } = req.body;
        const user_id = req.user.id;

        console.log(`🎫 Création ticket: service=${service_id}, méthode=${payment_method}`);

        const service = await Service.findByPk(service_id, {
            include: [
                {
                    model: Entity,
                    as: 'entity',
                    attributes: ['id', 'name']
                }
            ]
        });
        
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }

        // Vérifier le solde si paiement par wallet
        if (payment_method === 'wallet') {
            const transactions = await Transaction.findAll({
                where: { 
                    user_id, 
                    type: 'deposit',
                    status: 'success'
                }
            });
            const balance = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            
            console.log(`💰 Solde: ${balance} Ar, Prix: ${service.ticket_price} Ar`);
            
            if (balance < (service.ticket_price || 0)) {
                return res.status(400).json({ 
                    error: `Solde insuffisant. Solde: ${balance} Ar, Prix: ${service.ticket_price} Ar` 
                });
            }

            await Transaction.create({
                id: uuidv4(),
                user_id: user_id,
                type: 'ticket_purchase',
                amount: service.ticket_price || 0,
                payment_method: 'wallet',
                status: 'success',
                reference: `TICKET-${Date.now()}`,
                description: `Achat ticket pour ${service.name}`,
                provider: 'wallet',
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        // Générer le numéro de ticket
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        
        const lastTicket = await Ticket.findOne({
            order: [['created_at', 'DESC']]
        });
        
        let sequence = 1;
        if (lastTicket) {
            const lastNumber = lastTicket.ticket_number.split('-')[1];
            if (lastNumber) {
                sequence = parseInt(lastNumber) + 1;
            }
        }
        
        const ticketNumber = `${dateStr}-${String(sequence).padStart(4, '0')}`;

        console.log(`🔑 Numéro de ticket généré: ${ticketNumber}`);

        // ✅ Récupérer tous les tickets en attente pour ce service
        const existingTickets = await Ticket.findAll({
            where: {
                service_id: service_id,
                status: { [Op.in]: ['pending', 'waiting'] }
            },
            order: [['position', 'ASC']]
        });

        // ✅ Mettre à jour les positions des tickets existants
        const duration = service.estimated_duration || 15;
        for (let i = 0; i < existingTickets.length; i++) {
            const ticket = existingTickets[i];
            const newPosition = i + 1;
            const newEstimatedTime = newPosition * duration;
            
            await ticket.update({
                position: newPosition,
                estimated_wait_time: newEstimatedTime
            });
            
            console.log(`📊 Ticket ${ticket.ticket_number} -> Position ${newPosition}, Attente ${newEstimatedTime}min`);
        }

        // ✅ Créer le nouveau ticket avec la bonne position
        const newPosition = existingTickets.length + 1;
        const estimatedTime = newPosition * duration;

        const ticket = await Ticket.create({
            id: uuidv4(),
            service_id,
            user_id,
            ticket_number: ticketNumber,
            status: 'pending',
            position: newPosition,
            estimated_wait_time: estimatedTime,
            payment_status: 'paid',
            priority: 'standard',
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log(`✅ Ticket créé: ${ticketNumber} - Position: ${newPosition}, Attente: ${estimatedTime}min`);

        // ========== 📡 WEBSOCKET ==========
        try {
            console.log(`📡 [BACKEND] Tentative d'émission WebSocket pour service ${service_id}`);
            
            const { getIO } = await import('../sockets/index.js');
            const io = getIO();
            
            if (io) {
                console.log(`✅ [BACKEND] io récupéré, émission en cours...`);
                
                // ✅ Notifier l'agent
                io.to(`agent:${service_id}`).emit('new-ticket', {
                    ticket: {
                        id: ticket.id,
                        ticket_number: ticket.ticket_number,
                        status: ticket.status,
                        position: ticket.position,
                        estimated_wait_time: ticket.estimated_wait_time,
                        user: {
                            first_name: req.user.first_name,
                            last_name: req.user.last_name,
                            phone: req.user.phone
                        }
                    },
                    serviceId: service_id,
                    timestamp: new Date().toISOString()
                });

                // ✅ Mettre à jour les positions de tous les tickets
                const allTickets = await Ticket.findAll({
                    where: {
                        service_id: service_id,
                        status: { [Op.in]: ['pending', 'waiting'] }
                    },
                    order: [['position', 'ASC']]
                });

                const waitingCount = allTickets.length;

                for (let i = 0; i < allTickets.length; i++) {
                    const t = allTickets[i];
                    const pos = i + 1;
                    const estTime = pos * duration;
                    
                    io.to(`ticket:${t.id}`).emit('position-update', {
                        ticketId: t.id,
                        position: pos,
                        waitingCount: waitingCount,
                        estimatedTime: estTime,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`📡 position-update émis pour ticket ${t.ticket_number}: position ${pos}`);
                }

                // ✅ Mettre à jour la queue
                io.to(`queue:${service_id}`).emit('queue-updated', {
                    serviceId: service_id,
                    waitingCount: waitingCount,
                    newTicket: ticket,
                    timestamp: new Date().toISOString()
                });

                console.log(`✅ [BACKEND] Événements WebSocket émis pour service ${service_id}`);
            } else {
                console.error(`❌ [BACKEND] io est null!`);
            }
        } catch (wsError) {
            console.error('❌ [BACKEND] Erreur WebSocket:', wsError);
        }

        // ========== 📧 EMAIL ==========
        try {
            const user = await User.findByPk(user_id);
            
            if (user && user.email) {
                console.log('📧 Envoi de l\'email de confirmation...');
                console.log('📧 Destinataire:', user.email);
                console.log('📧 Ticket:', ticket.ticket_number);
                
                await emailService.sendTicketConfirmation(
                    user.email,
                    ticket.ticket_number,
                    service.name,
                    ticket.position || 1,
                    ticket.estimated_wait_time || 15
                );
                console.log(`✅ Email de confirmation envoyé à ${user.email}`);
            } else {
                console.log('⚠️ Aucun email pour l\'utilisateur');
            }
        } catch (emailError) {
            console.error('❌ Erreur envoi email confirmation:', emailError);
        }

        res.status(201).json({
            message: 'Ticket créé avec succès',
            ticket
        });

    } catch (error) {
        console.error('❌ Erreur création ticket:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== GET TICKET ==========
router.get('/tickets/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const ticket = await Ticket.findOne({
            where: { 
                id,
                user_id: userId
            },
            include: [
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name', 'estimated_duration']
                }
            ]
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }

        // ✅ Récupérer le nombre de clients en attente
        const waitingCount = await Ticket.count({
            where: {
                service_id: ticket.service_id,
                status: { [Op.in]: ['pending', 'waiting'] }
            }
        });

        // ✅ Retourner le ticket avec les informations
        res.json({
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status,
            position: ticket.position || 0,
            estimated_wait_time: ticket.estimated_wait_time || 0,
            service_id: ticket.service_id,
            created_at: ticket.created_at,
            waiting_count: waitingCount,
            service: ticket.service ? {
                id: ticket.service.id,
                name: ticket.service.name,
                estimated_duration: ticket.service.estimated_duration
            } : null
        });

    } catch (error) {
        console.error('❌ Erreur récupération ticket:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ✅ GET USER TICKETS (CORRIGÉ) ==========
router.get('/tickets', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const tickets = await Ticket.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name', 'estimated_duration']
                }
            ]
        });

        // ✅ Ajouter les informations de file pour chaque ticket
        const ticketsWithQueueInfo = await Promise.all(tickets.map(async (ticket) => {
            const waitingCount = await Ticket.count({
                where: {
                    service_id: ticket.service_id,
                    status: { [Op.in]: ['pending', 'waiting'] }
                }
            });

            const totalInQueue = await Ticket.count({
                where: {
                    service_id: ticket.service_id,
                    status: { [Op.in]: ['pending', 'waiting', 'called'] }
                }
            });

            return {
                id: ticket.id,
                ticket_number: ticket.ticket_number,
                status: ticket.status,
                position: ticket.position || 0,
                estimated_wait_time: ticket.estimated_wait_time || 0,
                service_id: ticket.service_id,
                created_at: ticket.created_at,
                waiting_count: waitingCount,
                total_in_queue: totalInQueue,
                service: ticket.service ? {
                    id: ticket.service.id,
                    name: ticket.service.name,
                    estimated_duration: ticket.service.estimated_duration
                } : null
            };
        }));

        res.json(ticketsWithQueueInfo);
    } catch (error) {
        console.error('❌ Erreur récupération tickets:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== CANCEL TICKET ==========
router.put('/tickets/:id/cancel', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const ticket = await Ticket.findOne({
            where: { 
                id,
                user_id: userId
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }

        if (ticket.status === 'completed' || ticket.status === 'cancelled') {
            return res.status(400).json({ error: 'Ce ticket ne peut pas être annulé' });
        }

        await ticket.update({
            status: 'cancelled',
            cancelled_at: new Date(),
            cancellation_reason: 'user_cancelled'
        });

        console.log(`✅ Ticket ${ticket.ticket_number} annulé par l'utilisateur`);

        res.json({
            message: 'Ticket annulé avec succès',
            ticket
        });
    } catch (error) {
        console.error('❌ Erreur annulation ticket:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
