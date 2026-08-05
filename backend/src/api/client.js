import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../middleware/auth.js';
import Entity from '../models/Entity.js';
import Service from '../models/Service.js';
import Ticket from '../models/Ticket.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import emailService from '../services/EmailService.js';
import TimeSlot from '../models/TimeSlot.js';

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

// ========== RÉCUPÉRER LES CRÉNEAUX DISPONIBLES ==========
router.get('/services/:serviceId/slots', auth, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { date } = req.query;

        console.log(`📅 Récupération des créneaux pour le service ${serviceId}`);

        // Vérifier que le service existe
        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }

        // Vérifier si le service accepte les rendez-vous
        if (!service.allow_appointment) {
            return res.status(400).json({ 
                error: 'Ce service ne permet pas la prise de rendez-vous' 
            });
        }

        // Générer les créneaux pour les 7 prochains jours
        const slots = await generateSlotsForService(service);

        // Grouper par date
        const slotsByDate = {};
        const allDates = [];

        slots.forEach(slot => {
            const dateKey = slot.date;
            if (!slotsByDate[dateKey]) {
                slotsByDate[dateKey] = [];
                allDates.push(dateKey);
            }
            slotsByDate[dateKey].push({
                id: slot.id,
                start_time: slot.start_time,
                end_time: slot.end_time,
                available: slot.max_capacity - slot.booked_count,
                max_capacity: slot.max_capacity,
                is_available: slot.is_available && (slot.max_capacity - slot.booked_count > 0)
            });
        });

        // Trier les dates
        allDates.sort();

        // Si une date spécifique est demandée, ne retourner que celle-ci
        let filteredSlots = slotsByDate;
        if (date) {
            filteredSlots = {};
            if (slotsByDate[date]) {
                filteredSlots[date] = slotsByDate[date];
            }
        }

        res.json({
            service: {
                id: service.id,
                name: service.name,
                allow_appointment: service.allow_appointment,
                slot_duration: service.slot_duration
            },
            slots: filteredSlots,
            available_dates: allDates,
            total: slots.length
        });

    } catch (error) {
        console.error('❌ Erreur récupération créneaux:', error);
        res.status(500).json({ error: error.message });
    }
});
// ========== GÉNÉRER LES CRÉNEAUX ==========
async function generateSlotsForService(service) {
    const slots = [];
    const today = new Date();
    const daysAhead = service.appointment_days_ahead || 7;
    const slotDuration = service.slot_duration || 15;
    const startHour = service.appointment_start_hour || 8;
    const endHour = service.appointment_end_hour || 17;
    const breakStart = service.break_start;
    const breakEnd = service.break_end;

    console.log(`📅 Génération des créneaux pour ${daysAhead} jours`);

    for (let d = 0; d < daysAhead; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];

        // Vérifier si c'est un jour de week-end (samedi, dimanche)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue; // Skip weekends
        }

        // Générer les créneaux pour la journée
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                // Vérifier si c'est l'heure de la pause
                if (breakStart && breakEnd) {
                    const currentTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    if (currentTime >= breakStart && currentTime < breakEnd) {
                        continue; // Skip break time
                    }
                }

                const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                
                // Calculer l'heure de fin
                const endMinute = minute + slotDuration;
                const endHourTime = hour + Math.floor(endMinute / 60);
                const endMinuteTime = endMinute % 60;
                const endTimeStr = `${String(endHourTime).padStart(2, '0')}:${String(endMinuteTime).padStart(2, '0')}`;

                // Vérifier si le créneau existe déjà
                let slot = await TimeSlot.findOne({
                    where: {
                        service_id: service.id,
                        date: dateStr,
                        start_time: timeStr
                    }
                });

                if (!slot) {
                    // Créer le créneau
                    slot = await TimeSlot.create({
                        id: uuidv4(),
                        service_id: service.id,
                        date: dateStr,
                        start_time: timeStr,
                        end_time: endTimeStr,
                        max_capacity: 1,
                        booked_count: 0,
                        is_available: true
                    });
                    console.log(`✅ Créneau créé: ${dateStr} à ${timeStr}`);
                }

                slots.push(slot);
            }
        }
    }

    return slots;
}

// ========== RÉCUPÉRER LES CRÉNEAUX POUR UNE DATE SPÉCIFIQUE ==========
router.get('/services/:serviceId/slots/date', auth, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'La date est requise' });
        }

        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }

        // Récupérer les créneaux pour la date
        const slots = await TimeSlot.findAll({
            where: {
                service_id: serviceId,
                date: date,
                is_available: true
            },
            order: [['start_time', 'ASC']]
        });

        const availableSlots = slots.map(slot => ({
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            available: slot.max_capacity - slot.booked_count,
            is_available: slot.max_capacity - slot.booked_count > 0
        }));

        res.json({
            date: date,
            service_name: service.name,
            slots: availableSlots,
            total: availableSlots.length
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== RÉCUPÉRER LES DATES DISPONIBLES ==========
router.get('/services/:serviceId/dates', auth, async (req, res) => {
    try {
        const { serviceId } = req.params;

        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }

        // Récupérer toutes les dates avec des créneaux disponibles
        const slots = await TimeSlot.findAll({
            where: {
                service_id: serviceId,
                is_available: true
            },
            attributes: ['date'],
            group: ['date'],
            order: [['date', 'ASC']]
        });

        const availableDates = slots.map(slot => slot.date);

        res.json({
            service_name: service.name,
            available_dates: availableDates,
            total: availableDates.length
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== CRÉER UN TICKET AVEC RENDEZ-VOUS ==========
router.post('/tickets', auth, async (req, res) => {
    try {
        const { 
            service_id, 
            payment_method, 
            appointment_date, 
            appointment_time,
            time_slot_id,
            phone_number 
        } = req.body;
        const user_id = req.user.id;

        console.log(`🎫 Création ticket: service=${service_id}`);
        console.log(`📅 Rendez-vous: ${appointment_date} à ${appointment_time}`);

        // Vérifier le service
        const service = await Service.findByPk(service_id, {
            include: [{ model: Entity, as: 'entity' }]
        });
        
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }

        // Vérifier le créneau
        let slot = null;
        if (time_slot_id) {
            slot = await TimeSlot.findByPk(time_slot_id);
        } else if (appointment_date && appointment_time) {
            slot = await TimeSlot.findOne({
                where: {
                    service_id: service_id,
                    date: appointment_date,
                    start_time: appointment_time
                }
            });
        }

        if (!slot) {
            return res.status(404).json({ error: 'Créneau non trouvé' });
        }

        // Vérifier la disponibilité
        if (slot.booked_count >= slot.max_capacity) {
            return res.status(400).json({ error: 'Ce créneau est complet' });
        }

        // Vérifier le solde
        if (payment_method === 'wallet') {
            const balance = await getBalance(user_id);
            if (balance < (service.ticket_price || 0)) {
                return res.status(400).json({ 
                    error: `Solde insuffisant. Solde: ${balance} Ar, Prix: ${service.ticket_price} Ar` 
                });
            }
        }

        // Calculer la position
        const allTicketsForDate = await Ticket.findAll({
            where: {
                service_id: service_id,
                appointment_date: slot.date,
                status: { [Op.notIn]: ['cancelled', 'completed'] }
            },
            order: [['appointment_time', 'ASC']]
        });

        let position = allTicketsForDate.length + 1;
        let estimatedWaitTime = position * (service.estimated_duration || 15);

        // Réorganiser les positions
        for (let i = 0; i < allTicketsForDate.length; i++) {
            const ticket = allTicketsForDate[i];
            if (slot.start_time < ticket.appointment_time) {
                position = i + 1;
                estimatedWaitTime = position * (service.estimated_duration || 15);
                
                for (let j = i; j < allTicketsForDate.length; j++) {
                    const t = allTicketsForDate[j];
                    const newPosition = j + 2;
                    const newEstimatedTime = newPosition * (service.estimated_duration || 15);
                    await t.update({
                        position: newPosition,
                        estimated_wait_time: newEstimatedTime
                    });
                }
                break;
            }
        }

        // Réserver le créneau
        await slot.update({ 
            booked_count: slot.booked_count + 1 
        });

        // Générer le numéro de ticket
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const lastTicket = await Ticket.findOne({ order: [['created_at', 'DESC']] });
        let sequence = lastTicket ? parseInt(lastTicket.ticket_number.split('-')[1] || '0') + 1 : 1;
        const ticketNumber = `${dateStr}-${String(sequence).padStart(4, '0')}`;

        // Créer le ticket
        const ticket = await Ticket.create({
            id: uuidv4(),
            service_id,
            user_id,
            ticket_number: ticketNumber,
            status: 'pending',
            position: position,
            estimated_wait_time: estimatedWaitTime,
            payment_status: 'paid',
            priority: 'standard',
            appointment_date: slot.date,
            appointment_time: slot.start_time,
            time_slot_id: slot.id,
            position_in_slot: position,
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log(`✅ Ticket créé: ${ticketNumber}`);
        console.log(`📊 Position: ${position} - Attente: ${estimatedWaitTime}min`);

        // Envoyer l'email
        try {
            const user = await User.findByPk(user_id);
            if (user && user.email) {
                await emailService.sendTicketConfirmation(
                    user.email,
                    ticket.ticket_number,
                    service.name,
                    ticket.position,
                    ticket.estimated_wait_time,
                    ticket.appointment_date,
                    ticket.appointment_time
                );
            }
        } catch (emailError) {
            console.error('❌ Erreur envoi email:', emailError);
        }

        res.status(201).json({
            message: 'Ticket créé avec succès',
            ticket: {
                id: ticket.id,
                ticket_number: ticket.ticket_number,
                position: ticket.position,
                estimated_wait_time: ticket.estimated_wait_time,
                appointment_date: ticket.appointment_date,
                appointment_time: ticket.appointment_time,
                status: ticket.status
            }
        });

    } catch (error) {
        console.error('❌ Erreur création ticket:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== FONCTION UTILITAIRE ==========
async function getBalance(userId) {
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
        } else if (t.type === 'ticket_purchase' || t.type === 'withdrawal' || t.type === 'refund') {
            balance -= parseFloat(t.amount);
        }
    });
    
    return balance;
}

export default router;