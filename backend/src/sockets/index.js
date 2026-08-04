import jwt from 'jsonwebtoken';
import { Ticket, Service, User } from '../models/index.js';
import { Op } from 'sequelize';
import Entity from '../models/Entity.js';
import EmailService from '../services/EmailService.js';

let ioInstance = null;

const setupSockets = (io) => {
    ioInstance = io;

    // Middleware d'authentification
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            return next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.userId}`);

        let pingInterval = setInterval(() => {
            if (socket.connected) {
                socket.emit('ping');
            }
        }, 25000);

        // ✅ Rejoindre la room des services d'une entreprise
        socket.on('join-service-room', ({ companyId }) => {
            if (!companyId) {
                socket.emit('error', { message: 'Company ID requis' });
                return;
            }
            socket.join(`service:${companyId}`);
            console.log(`📋 User ${socket.userId} a rejoint service:${companyId}`);
        });

        // ✅ Quitter la room des services
        socket.on('leave-service-room', ({ companyId }) => {
            if (!companyId) return;
            socket.leave(`service:${companyId}`);
            console.log(`📋 User ${socket.userId} a quitté service:${companyId}`);
        });

        // Agent se connecte
socket.on('agent-connect', async ({ serviceId }) => {
    if (!serviceId) {
        socket.emit('error', { message: 'Service ID requis' });
        return;
    }

    socket.join(`agent:${serviceId}`);
    socket.agentServiceId = serviceId;
    console.log(`✅ Agent ${socket.userId} connecté au service ${serviceId}`);

    // ✅ Vérifier la room
    const room = io.sockets.adapter.rooms.get(`agent:${serviceId}`);
    console.log(`📊 [BACKEND] Room agent:${serviceId} a ${room ? room.size : 0} membres`);

            try {
               
const waitingList = await Ticket.findAll({
    where: {
        service_id: serviceId,
        status: 'waiting'
    },
    order: [['position', 'ASC']],
    include: [
        { 
            model: User, 
            as: 'client',  
            attributes: ['id', 'first_name', 'last_name', 'phone', 'email'] 
        },
        { 
            model: Service, 
            as: 'service',  
            attributes: ['id', 'name'] 
        }
    ]
});
                socket.emit('waiting-list', waitingList);
                console.log(`📋 Envoyé ${waitingList.length} tickets en attente`);
            } catch (error) {
                console.error('❌ Erreur récupération waiting-list:', error);
                socket.emit('error', { message: 'Erreur chargement liste d\'attente' });
            }
        });

        // Suivre un ticket (client)
        socket.on('track-ticket', async ({ ticketId }) => {
            if (!ticketId) {
                socket.emit('error', { message: 'Ticket ID requis' });
                return;
            }
            socket.join(`ticket:${ticketId}`);
            console.log(`User ${socket.userId} tracking ticket ${ticketId}`);

            try {
               const ticket = await Ticket.findByPk(ticketId, {
    include: [
        { 
            model: Service, 
            as: 'service',  // ✅ AJOUTER ALIAS
            include: [{ model: Entity, as: 'entity' }]  // ✅ AJOUTER ALIAS
        },
        { 
            model: User, 
            as: 'client',  // ✅ AJOUTER ALIAS
            attributes: ['id', 'first_name', 'last_name'] 
        }
    ]
});
                if (ticket) {
                    socket.emit('ticket-status', { ticket });
                }
            } catch (error) {
                console.error('❌ Erreur ticket-status:', error);
            }
        });

        // Suivre une file (client)
        socket.on('join-queue-room', ({ serviceId }) => {
            if (!serviceId) {
                console.error('❌ join-queue-room: serviceId is undefined');
                socket.emit('error', { message: 'Service ID requis' });
                return;
            }
            socket.join(`queue:${serviceId}`);
            console.log(`User ${socket.userId} joined queue ${serviceId}`);
            sendQueueStatus(socket, serviceId);
        });

        // Demander la position
        socket.on('request-position-update', async ({ ticketId }) => {
            try {
                const ticket = await Ticket.findByPk(ticketId);
                if (!ticket) {
                    socket.emit('error', { message: 'Ticket not found' });
                    return;
                }

                const position = ticket.position;
                const waitingCount = await Ticket.count({
                    where: {
                        service_id: ticket.service_id,
                        status: 'waiting'
                    }
                });

                socket.emit('position-update', {
                    ticketId,
                    position,
                    waitingCount,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Erreur request-position-update:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // 🔥 Appeler le prochain client (agent)
        socket.on('call-next', async ({ serviceId }) => {
            try {
                const nextTicket = await Ticket.findOne({
    where: {
        service_id: serviceId,
        status: 'waiting'
    },
    order: [['position', 'ASC']],
    include: [
        { 
            model: User, 
            as: 'client',  // ✅ AJOUTER ALIAS
            attributes: ['id', 'first_name', 'last_name', 'phone', 'email'] 
        },
        { 
            model: Service, 
            as: 'service',  // ✅ AJOUTER ALIAS
            attributes: ['id', 'name'] 
        }
    ]
});

                if (!nextTicket) {
                    socket.emit('error', { message: 'Plus de tickets en attente' });
                    return;
                }

                nextTicket.status = 'called';
                nextTicket.called_at = new Date();
                await nextTicket.save();

                socket.emit('ticket-called', nextTicket);

                io.to(`ticket:${nextTicket.id}`).emit('you-are-called', {
                    ticketId: nextTicket.id,
                    ticketNumber: nextTicket.ticket_number,
                    serviceId,
                    calledAt: new Date().toISOString()
                });

                try {
                    if (nextTicket.User && nextTicket.User.email) {
                        await EmailService.sendTicketCalled(
                            nextTicket.User.email,
                            nextTicket.ticket_number,
                            nextTicket.Service?.name || 'Service'
                        );
                        console.log(`📧 Email d'appel envoyé à ${nextTicket.User.email}`);
                    }
                } catch (emailError) {
                    console.error('❌ Erreur envoi email appel:', emailError);
                }

                const waitingList = await Ticket.findAll({
                    where: {
                        service_id: serviceId,
                        status: 'waiting'
                    },
                    order: [['position', 'ASC']],
                    include: [
                        { model: User, attributes: ['id', 'first_name', 'last_name', 'phone', 'email'] }
                    ]
                });
                io.to(`agent:${serviceId}`).emit('waiting-list', waitingList);

                io.to(`queue:${serviceId}`).emit('queue-updated', {
                    serviceId,
                    waitingCount: waitingList.length,
                    calledTicket: nextTicket,
                    timestamp: new Date().toISOString()
                });

                await recalculatePositions(io, serviceId);

                console.log(`📞 Ticket ${nextTicket.ticket_number} appelé - Positions mises à jour`);
            } catch (error) {
                console.error('❌ Erreur call-next:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // 🔥 Servir un ticket (agent)
        socket.on('serve-ticket', async ({ ticketId }) => {
            try {
                const ticket = await Ticket.findByPk(ticketId, {
                    include: [
                        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
                        { model: Service, attributes: ['id', 'name'] }
                    ]
                });

                if (!ticket) {
                    socket.emit('error', { message: 'Ticket not found' });
                    return;
                }

                ticket.status = 'served';
                ticket.served_at = new Date();
                await ticket.save();

                io.to(`ticket:${ticketId}`).emit('ticket-served', {
                    ticketId,
                    ticketNumber: ticket.ticket_number,
                    servedAt: ticket.served_at
                });

                const waitingList = await Ticket.findAll({
                    where: {
                        service_id: ticket.service_id,
                        status: 'waiting'
                    },
                    order: [['position', 'ASC']],
                    include: [
                        { model: User, attributes: ['id', 'first_name', 'last_name', 'phone', 'email'] }
                    ]
                });
                io.to(`agent:${ticket.service_id}`).emit('waiting-list', waitingList);

                io.to(`queue:${ticket.service_id}`).emit('queue-updated', {
                    serviceId: ticket.service_id,
                    waitingCount: waitingList.length,
                    servedTicket: ticket,
                    timestamp: new Date().toISOString()
                });

                await recalculatePositions(io, ticket.service_id);

                socket.emit('ticket-served-confirmed', { ticketId });
                console.log(`✅ Ticket ${ticket.ticket_number} servi - Positions mises à jour`);
            } catch (error) {
                console.error('❌ Erreur serve-ticket:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // 🔥 Annuler un ticket (agent)
        socket.on('cancel-ticket', async ({ ticketId, reason }) => {
            try {
                const ticket = await Ticket.findByPk(ticketId, {
                    include: [
                        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
                        { model: Service, attributes: ['id', 'name'] }
                    ]
                });

                if (!ticket) {
                    socket.emit('error', { message: 'Ticket not found' });
                    return;
                }

                ticket.status = 'cancelled';
                ticket.cancelled_at = new Date();
                ticket.cancellation_reason = reason || 'Annulé par l\'agent';
                await ticket.save();

                io.to(`ticket:${ticketId}`).emit('ticket-cancelled', {
                    ticketId,
                    reason: ticket.cancellation_reason,
                    cancelledAt: ticket.cancelled_at
                });

                const waitingList = await Ticket.findAll({
                    where: {
                        service_id: ticket.service_id,
                        status: 'waiting'
                    },
                    order: [['position', 'ASC']],
                    include: [
                        { model: User, attributes: ['id', 'first_name', 'last_name', 'phone', 'email'] }
                    ]
                });
                io.to(`agent:${ticket.service_id}`).emit('waiting-list', waitingList);

                io.to(`queue:${ticket.service_id}`).emit('queue-updated', {
                    serviceId: ticket.service_id,
                    waitingCount: waitingList.length,
                    cancelledTicket: ticket,
                    timestamp: new Date().toISOString()
                });

                await recalculatePositions(io, ticket.service_id);

                socket.emit('ticket-cancelled-confirmed', { ticketId });
                console.log(`❌ Ticket ${ticket.ticket_number} annulé - Positions mises à jour`);
            } catch (error) {
                console.error('❌ Erreur cancel-ticket:', error);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            clearInterval(pingInterval);
            console.log(`❌ User disconnected: ${socket.userId}`);
        });
    });
};

// 🔥 Fonction pour envoyer le statut de la file
async function sendQueueStatus(socket, serviceId) {
    try {
        const waitingCount = await Ticket.count({
            where: {
                service_id: serviceId,
                status: 'waiting'
            }
        });

        socket.emit('queue-status', {
            serviceId,
            waitingCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error sending queue status:', error);
    }
}

// 🔥 Recalculer les positions
async function recalculatePositions(io, serviceId) {
    try {
        const remainingTickets = await Ticket.findAll({
            where: {
                service_id: serviceId,
                status: 'waiting'
            },
            order: [['position', 'ASC']]
        });

        const waitingCount = remainingTickets.length;

        for (let i = 0; i < remainingTickets.length; i++) {
            const ticket = remainingTickets[i];
            const newPosition = i + 1;

            if (ticket.position !== newPosition) {
                ticket.position = newPosition;
                await ticket.save();
            }

            const estimatedTime = newPosition * 5;

            io.to(`ticket:${ticket.id}`).emit('position-update', {
                ticketId: ticket.id,
                position: newPosition,
                waitingCount,
                estimatedTime,
                timestamp: new Date().toISOString()
            });

            if (newPosition <= 3) {
                io.to(`ticket:${ticket.id}`).emit('you-are-near', {
                    position: newPosition,
                    ticketId: ticket.id,
                    estimatedTime
                });
            }
        }

        return remainingTickets;
    } catch (error) {
        console.error('❌ Erreur recalculatePositions:', error);
        return [];
    }
}

// 🔥 Fonction pour récupérer l'instance de io
const getIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.io not initialized');
    }
    return ioInstance;
};

// ========== ÉMISSIONS POUR LES SERVICES ==========
const emitServiceCreated = (companyId, service) => {
    try {
        const io = getIO();
        io.to(`service:${companyId}`).emit('service-created', {
            service,
            companyId,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 Service créé: ${service.name} pour entreprise ${companyId}`);
    } catch (error) {
        console.error('❌ Erreur emitServiceCreated:', error);
    }
};

const emitServiceUpdated = (companyId, service) => {
    try {
        const io = getIO();
        io.to(`service:${companyId}`).emit('service-updated', {
            service,
            companyId,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 Service mis à jour: ${service.name}`);
    } catch (error) {
        console.error('❌ Erreur emitServiceUpdated:', error);
    }
};

const emitServiceDeleted = (companyId, serviceId, serviceName) => {
    try {
        const io = getIO();
        io.to(`service:${companyId}`).emit('service-deleted', {
            serviceId,
            serviceName,
            companyId,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 Service supprimé: ${serviceName}`);
    } catch (error) {
        console.error('❌ Erreur emitServiceDeleted:', error);
    }
};

// ========== FONCTIONS D'ÉMISSION POUR LES ENTREPRISES ==========
const emitCompanyCreated = (company) => {
    try {
        const io = getIO();
        io.emit('company-created', { 
            company,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 Entreprise créée: ${company.name}`);
    } catch (error) {
        console.error('❌ Erreur emitCompanyCreated:', error);
    }
};

const emitCompanyUpdated = (company) => {
    try {
        const io = getIO();
        io.emit('company-updated', { 
            company,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 Entreprise mise à jour: ${company.name}`);
    } catch (error) {
        console.error('❌ Erreur emitCompanyUpdated:', error);
    }
};

const emitCompanyDeleted = (companyId, companyName) => {
    try {
        const io = getIO();
        io.emit('company-deleted', { 
            companyId,
            companyName,
            timestamp: new Date().toISOString()
        });
        console.log(`📢 Entreprise supprimée: ${companyName}`);
    } catch (error) {
        console.error('❌ Erreur emitCompanyDeleted:', error);
    }
};

// ========== UN SEUL EXPORT ==========
export default setupSockets;
export { 
    getIO, 
    emitServiceCreated, 
    emitServiceUpdated, 
    emitServiceDeleted,
    emitCompanyCreated,
    emitCompanyUpdated,
    emitCompanyDeleted
};