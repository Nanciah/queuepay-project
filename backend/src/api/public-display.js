const express = require('express');
const router = express.Router();
const { Ticket, Service, Entity } = require('../models');
const { Op } = require('sequelize');

// Écran public pour une entité
router.get('/entity/:entityId', async (req, res) => {
    try {
        const { entityId } = req.params;
        const { limit = 20 } = req.query;

        const entity = await Entity.findByPk(entityId);
        if (!entity) {
            return res.status(404).json({ success: false, error: 'Entité non trouvée' });
        }

        const services = await Service.findAll({
            where: { entity_id: entityId, is_active: true }
        });

        const serviceIds = services.map(s => s.id);

        const waiting = await Ticket.findAll({
            where: {
                service_id: { [Op.in]: serviceIds },
                status: ['waiting', 'called']
            },
            include: [{ model: Service }, { model: User, attributes: ['first_name', 'last_name'] }],
            order: [['position', 'ASC']],
            limit: parseInt(limit)
        });

        const called = waiting.filter(t => t.status === 'called');
        const waitingList = waiting.filter(t => t.status === 'waiting');

        res.json({
            success: true,
            entity: {
                id: entity.id,
                name: entity.name,
                logo_url: entity.logo_url
            },
            stats: {
                totalWaiting: waitingList.length,
                totalCalled: called.length,
                totalServices: services.length
            },
            called: called.map(t => ({
                ticketNumber: t.ticket_number,
                serviceName: t.Service?.name,
                calledAt: t.called_at,
                customerName: t.User ? `${t.User.first_name} ${t.User.last_name}` : 'Anonyme'
            })),
            waiting: waitingList.map(t => ({
                ticketNumber: t.ticket_number,
                serviceName: t.Service?.name,
                position: t.position,
                estimatedWaitTime: t.estimated_wait_time
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// État général des services
router.get('/services-status', async (req, res) => {
    try {
        const services = await Service.findAll({
            where: { is_active: true },
            include: [{ model: Entity }]
        });

        const status = await Promise.all(services.map(async (service) => {
            const waiting = await Ticket.count({
                where: { service_id: service.id, status: 'waiting' }
            });
            const called = await Ticket.count({
                where: { service_id: service.id, status: 'called' }
            });
            const served = await Ticket.count({
                where: { service_id: service.id, status: 'served' }
            });

            return {
                id: service.id,
                name: service.name,
                entity: service.Entity?.name,
                status: {
                    waiting,
                    called,
                    served,
                    total: waiting + called + served
                }
            };
        }));

        res.json({ success: true, services: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;