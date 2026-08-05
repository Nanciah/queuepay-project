import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import User from '../models/User.js';
import Entity from '../models/Entity.js';
import Service from '../models/Service.js';
import Ticket from '../models/Ticket.js';
import Transaction from '../models/Transaction.js';
import { auth } from '../middleware/auth.js';
import EmailService from '../services/emailService.js';
import { emitServiceCreated, emitServiceUpdated, emitServiceDeleted, getIO } from '../sockets/index.js';

const router = express.Router();

const isCompanyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    if (req.user.role !== 'company_admin') {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs d\'entreprise' });
    }
    if (!req.user.company_id) {
        return res.status(403).json({ error: 'Aucune entreprise associée à ce compte' });
    }
    next();
};

// ========== PARAMÈTRES DE L'ENTREPRISE ==========
router.get('/settings', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        
        const company = await Entity.findByPk(companyId, {
            attributes: ['id', 'name', 'description', 'address', 'city', 'phone', 'email', 'settings']
        });
        
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        
        res.json({
            ...company.toJSON(),
            settings: company.settings || {}
        });
    } catch (error) {
        console.error('❌ Erreur récupération paramètres:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/settings', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { name, description, address, city, phone, email, settings } = req.body;
        
        const company = await Entity.findByPk(companyId);
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        
        await company.update({
            name,
            description,
            address,
            city,
            phone,
            email,
            settings: settings || company.settings
        });
        
        res.json({
            message: 'Paramètres mis à jour avec succès',
            company
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour paramètres:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== STATISTIQUES ==========
router.get('/stats', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        
        const totalServices = await Service.count({ 
            where: { entity_id: companyId } 
        });
        
        const totalAgents = await User.count({ 
            where: { 
                company_id: companyId, 
                role: 'agent' 
            } 
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const serviceIds = await Service.findAll({
            where: { entity_id: companyId },
            attributes: ['id']
        });
        const serviceIdList = serviceIds.map(s => s.id);
        
        let todayTickets = 0;
        if (serviceIdList.length > 0) {
            todayTickets = await Ticket.count({
                where: {
                    service_id: { [Op.in]: serviceIdList },
                    created_at: { [Op.gte]: today }
                }
            });
        }
        
        const totalRevenue = await Transaction.sum('amount', {
            where: {
                type: 'ticket_purchase',
                status: 'success'
            }
        });

        res.json({
            totalServices: totalServices || 0,
            totalAgents: totalAgents || 0,
            todayTickets: todayTickets || 0,
            totalRevenue: totalRevenue || 0,
            activeQueues: 0,
            averageWaitTime: 0
        });
        
    } catch (error) {
        console.error('Erreur stats company:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== SERVICES ==========
router.get('/services', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const services = await Service.findAll({
            where: { entity_id: companyId },
            order: [['createdAt', 'DESC']]
        });
        res.json({ services });
    } catch (error) {
        console.error('Erreur services:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/services', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { name, description, category, price, duration, capacity, agent_id } = req.body;
        
        const service = await Service.create({
            id: uuidv4(),
            entity_id: companyId,
            agent_id: agent_id || null,
            name,
            description,
            category: category || 'other',
            ticket_price: price || 0,
            estimated_duration: duration || 15,
            max_capacity: capacity || 50,
            is_active: true
        });
        
        emitServiceCreated(companyId, service);
        
        res.status(201).json({
            message: 'Service créé avec succès',
            service
        });

    } catch (error) {
        console.error('Erreur création service:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/services/:id', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const service = await Service.findOne({
            where: { 
                id: req.params.id,
                entity_id: companyId
            }
        });
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }
        res.json({ service });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/services/:id', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { name, description, category, price, duration, capacity, is_active, agent_id } = req.body;
        const service = await Service.findOne({
            where: { 
                id: req.params.id,
                entity_id: companyId
            }
        });
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }
        await service.update({ 
            name, 
            description, 
            category, 
            ticket_price: price || 0,
            estimated_duration: duration || 15,
            max_capacity: capacity || 50,
            is_active,
            agent_id: agent_id || null
        });
        
        emitServiceUpdated(companyId, service);
        
        res.json({ message: 'Service mis à jour', service });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/services/:id', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const service = await Service.findOne({
            where: { 
                id: req.params.id,
                entity_id: companyId
            }
        });
        if (!service) {
            return res.status(404).json({ error: 'Service non trouvé' });
        }
        
        const serviceName = service.name;
        
        await service.destroy();
        
        emitServiceDeleted(companyId, req.params.id, serviceName);
        
        res.json({ message: 'Service supprimé' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== AGENTS ==========
router.get('/agents', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        
        const agents = await User.findAll({
            where: { 
                company_id: companyId, 
                role: 'agent'
            },
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        
        const agentsWithServices = await Promise.all(agents.map(async (agent) => {
            const services = await Service.findAll({
                where: {
                    id: { [Op.in]: agent.assigned_services || [] }
                },
                attributes: ['id', 'name']
            });
            return {
                ...agent.toJSON(),
                services: services,
                assigned_service_ids: agent.assigned_services || []
            };
        }));
        
        res.json({ agents: agentsWithServices });
    } catch (error) {
        console.error('Erreur agents:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/agents', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { firstName, lastName, email, phone, serviceIds } = req.body;
        
        console.log('📝 Création agent:');
        console.log('   - Email:', email);
        console.log('   - Nom:', firstName, lastName);
        console.log('   - Entreprise:', companyId);
        
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'Cet email est déjà utilisé par un autre compte',
                existingUser: {
                    email: existingUser.email,
                    role: existingUser.role
                }
            });
        }
        
        const password = Math.random().toString(36).slice(-8) + 'A1!';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('🔑 Mot de passe généré:', password);
        
        const agent = await User.create({
            id: uuidv4(),
            email,
            phone,
            password: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            role: 'agent',
            company_id: companyId,
            status: 'active',
            phone_verified: true,
            email_verified: true,
            assigned_services: serviceIds || []
        });
        
        console.log('✅ Agent créé avec ID:', agent.id);
        
        const company = await Entity.findByPk(companyId);
        const companyName = company ? company.name : 'Entreprise';
        
        let emailSent = false;
        let emailError = null;
        
        try {
            await EmailService.sendAgentCredentialsEmail(
                agent.email,
                password,
                companyName,
                `${agent.first_name} ${agent.last_name}`
            );
            emailSent = true;
            console.log(`✅ Email envoyé à: ${agent.email}`);
        } catch (error) {
            emailError = error.message;
            console.error(`❌ Erreur envoi email à ${agent.email}:`, error);
        }
        
        const services = await Service.findAll({
            where: {
                id: { [Op.in]: agent.assigned_services || [] }
            },
            attributes: ['id', 'name']
        });
        
        res.status(201).json({
            message: 'Agent créé avec succès',
            agent: {
                id: agent.id,
                email: agent.email,
                phone: agent.phone,
                firstName: agent.first_name,
                lastName: agent.last_name,
                password: password,
                assigned_services: agent.assigned_services || [],
                services: services
            },
            email: {
                sent: emailSent,
                error: emailError
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur création agent:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
});

router.get('/agents/:id', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const agent = await User.findOne({
            where: { 
                id: req.params.id,
                company_id: companyId,
                role: 'agent'
            },
            attributes: { exclude: ['password'] }
        });
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        const services = await Service.findAll({
            where: {
                id: { [Op.in]: agent.assigned_services || [] }
            },
            attributes: ['id', 'name']
        });
        
        res.json({ 
            agent: {
                ...agent.toJSON(),
                services: services,
                assigned_service_ids: agent.assigned_services || []
            }
        });
    } catch (error) {
        console.error('Erreur récupération agent:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/agents/:id', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { firstName, lastName, phone, status, serviceIds } = req.body;
        
        const agent = await User.findOne({
            where: { 
                id: req.params.id,
                company_id: companyId,
                role: 'agent'
            }
        });
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        await agent.update({ 
            first_name: firstName, 
            last_name: lastName, 
            phone, 
            status,
            assigned_services: serviceIds || agent.assigned_services
        });
        
        const services = await Service.findAll({
            where: {
                id: { [Op.in]: agent.assigned_services || [] }
            },
            attributes: ['id', 'name']
        });
        
        res.json({ 
            message: 'Agent mis à jour',
            agent: {
                ...agent.toJSON(),
                services: services,
                assigned_service_ids: agent.assigned_services || []
            }
        });
    } catch (error) {
        console.error('Erreur mise à jour agent:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/agents/:id', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        
        const agent = await User.findOne({
            where: { 
                id: req.params.id,
                company_id: companyId,
                role: 'agent'
            }
        });
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        await Service.update(
            { agent_id: null },
            { where: { agent_id: agent.id } }
        );
        
        await agent.destroy({ force: true });
        
        res.json({ 
            message: 'Agent supprimé avec succès',
            deletedAgent: {
                id: agent.id,
                email: agent.email,
                firstName: agent.first_name,
                lastName: agent.last_name
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur suppression agent:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== SERVICES AVEC STATS ==========
router.get('/services-with-stats', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        
        const services = await Service.findAll({
            where: { entity_id: companyId },
            order: [['createdAt', 'DESC']]
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const servicesWithStats = await Promise.all(services.map(async (service) => {
            const waitingCount = await Ticket.count({
                where: {
                    service_id: service.id,
                    status: ['waiting', 'pending']
                }
            });
            
            const todayTickets = await Ticket.count({
                where: {
                    service_id: service.id,
                    created_at: { [Op.gte]: today }
                }
            });
            
            const avgWaitTime = waitingCount * (service.estimated_duration || 15);
            
            return {
                ...service.toJSON(),
                waitingCount,
                todayTickets,
                avgWaitTime,
                saturation: service.max_capacity ? Math.round((waitingCount / service.max_capacity) * 100) : 0
            };
        }));
        
        res.json({ services: servicesWithStats });
    } catch (error) {
        console.error('Erreur récupération services avec stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== TRANSACTIONS ==========
router.get('/transactions', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { type, status, search, page = 1, limit = 10 } = req.query;
        
        const userIds = await User.findAll({
            where: { company_id: companyId },
            attributes: ['id']
        });
        const userIdList = userIds.map(u => u.id);
        
        const where = {
            user_id: { [Op.in]: userIdList }
        };
        
        if (type && type !== 'all') where.type = type;
        if (status && status !== 'all') where.status = status;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await Transaction.findAndCountAll({
            where,
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] 
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });
        
        res.json({
            transactions: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération transactions entreprise:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/transactions/export', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { type, status, startDate, endDate } = req.query;
        
        const userIds = await User.findAll({
            where: { company_id: companyId },
            attributes: ['id']
        });
        const userIdList = userIds.map(u => u.id);
        
        const where = {
            user_id: { [Op.in]: userIdList }
        };
        
        if (type && type !== 'all') where.type = type;
        if (status && status !== 'all') where.status = status;
        if (startDate) where.created_at = { [Op.gte]: startDate };
        if (endDate) where.created_at = { [Op.lte]: endDate };
        
        const transactions = await Transaction.findAll({
            where,
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    attributes: ['id', 'first_name', 'last_name', 'email'] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        let csv = 'Référence,Type,Montant,Frais,Statut,Client,Email,Méthode,Date\n';
        transactions.forEach(tx => {
            const row = [
                tx.reference || tx.id,
                tx.type,
                tx.amount,
                tx.fee || 0,
                tx.status,
                tx.user ? `${tx.user.first_name || ''} ${tx.user.last_name || ''}` : '',
                tx.user ? tx.user.email || '' : '',
                tx.payment_method || tx.provider || '',
                tx.createdAt
            ];
            csv += row.join(',') + '\n';
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_entreprise_${Date.now()}.csv`);
        res.send(csv);
        
    } catch (error) {
        console.error('❌ Erreur export transactions:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== STATISTIQUES AVANCÉES ==========
router.get('/advanced-stats', auth, isCompanyAdmin, async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { period = 'month' } = req.query;
        
        const services = await Service.findAll({
            where: { entity_id: companyId },
            attributes: ['id', 'name', 'ticket_price']
        });
        const serviceIds = services.map(s => s.id);
        
        const now = new Date();
        let startDate = new Date();
        let groupFormat = 'day';
        
        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                groupFormat = 'hour';
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                groupFormat = 'day';
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                groupFormat = 'day';
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                groupFormat = 'month';
                break;
            default:
                startDate.setMonth(startDate.getMonth() - 1);
                groupFormat = 'day';
        }
        
        const ticketsByPeriod = await Ticket.findAll({
            where: {
                service_id: { [Op.in]: serviceIds },
                created_at: { [Op.gte]: startDate }
            },
            attributes: [
                [sequelize.fn('DATE_TRUNC', groupFormat, sequelize.col('created_at')), 'period'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['period'],
            order: [[sequelize.literal('period'), 'ASC']],
            raw: true
        });
        
        const ticketsByService = await Ticket.findAll({
            where: {
                service_id: { [Op.in]: serviceIds },
                created_at: { [Op.gte]: startDate }
            },
            attributes: [
                'service_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['service_id'],
            raw: true
        });
        
        const agents = await User.findAll({
            where: {
                company_id: companyId,
                role: 'agent'
            },
            attributes: ['id', 'first_name', 'last_name']
        });
        
        const agentPerformance = await Promise.all(agents.map(async (agent) => {
            const count = await Ticket.count({
                where: {
                    service_id: { [Op.in]: serviceIds },
                    user_id: agent.id,
                    status: 'completed',
                    created_at: { [Op.gte]: startDate }
                }
            });
            return {
                agent_id: agent.id,
                name: `${agent.first_name} ${agent.last_name}`,
                count: count
            };
        }));
        
        const totalTickets = await Ticket.count({
            where: {
                service_id: { [Op.in]: serviceIds },
                created_at: { [Op.gte]: startDate }
            }
        });
        
        const userIds = await User.findAll({
            where: { company_id: companyId },
            attributes: ['id']
        });
        const userIdList = userIds.map(u => u.id);
        
        const totalRevenue = await Transaction.sum('amount', {
            where: {
                type: 'ticket_purchase',
                status: 'success',
                user_id: { [Op.in]: userIdList },
                created_at: { [Op.gte]: startDate }
            }
        });
        
        const servicesMap = {};
        services.forEach(s => servicesMap[s.id] = s.name);
        
        const serviceStats = ticketsByService.map(item => ({
            name: servicesMap[item.service_id] || 'Inconnu',
            count: parseInt(item.count)
        }));
        
        const agentStats = agentPerformance
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count);
        
        res.json({
            period,
            totalTickets,
            totalRevenue: totalRevenue || 0,
            chartData: ticketsByPeriod.map(item => ({
                period: item.period,
                count: parseInt(item.count)
            })),
            serviceDistribution: serviceStats,
            agentPerformance: agentStats,
            agents: agents.map(a => ({ 
                id: a.id, 
                name: `${a.first_name} ${a.last_name}` 
            }))
        });
        
    } catch (error) {
        console.error('❌ Erreur statistiques avancées:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== AGENT SPECIFIC ROUTES ==========

const isAgent = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    if (req.user.role !== 'agent') {
        return res.status(403).json({ error: 'Accès réservé aux agents' });
    }
    if (!req.user.company_id) {
        return res.status(403).json({ error: 'Aucune entreprise associée à ce compte' });
    }
    next();
};

router.get('/agent/stats', auth, isAgent, async (req, res) => {
    try {
        const agentId = req.user.id;
        const companyId = req.user.company_id;
        
        const services = await Service.findAll({
            where: {
                entity_id: companyId,
                agent_id: agentId
            }
        });
        const serviceIds = services.map(s => s.id);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTickets = await Ticket.count({
            where: {
                service_id: { [Op.in]: serviceIds },
                created_at: { [Op.gte]: today },
                agent_id: agentId
            }
        });
        
        const waitingTickets = await Ticket.count({
            where: {
                service_id: { [Op.in]: serviceIds },
                status: ['waiting', 'pending']
            }
        });
        
        const completedToday = await Ticket.count({
            where: {
                service_id: { [Op.in]: serviceIds },
                status: 'completed',
                completed_at: { [Op.gte]: today },
                agent_id: agentId
            }
        });
        
        const totalServed = await Ticket.count({
            where: {
                service_id: { [Op.in]: serviceIds },
                status: 'completed',
                agent_id: agentId
            }
        });
        
        const completedTickets = await Ticket.findAll({
            where: {
                service_id: { [Op.in]: serviceIds },
                status: 'completed',
                agent_id: agentId
            },
            attributes: ['estimated_wait_time']
        });
        
        let averageWaitTime = 0;
        if (completedTickets.length > 0) {
            const totalWait = completedTickets.reduce((sum, t) => sum + (t.estimated_wait_time || 0), 0);
            averageWaitTime = Math.round(totalWait / completedTickets.length);
        }
        
        res.json({
            todayTickets: todayTickets || 0,
            waitingTickets: waitingTickets || 0,
            completedToday: completedToday || 0,
            averageWaitTime: averageWaitTime || 15,
            totalServed: totalServed || 0
        });
    } catch (error) {
        console.error('❌ Erreur stats agent:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/agent/services', auth, isAgent, async (req, res) => {
    try {
        const agentId = req.user.id;
        const companyId = req.user.company_id;
        
        const services = await Service.findAll({
            where: {
                entity_id: companyId,
                agent_id: agentId,
                is_active: true
            },
            order: [['name', 'ASC']]
        });
        
        const servicesWithCount = await Promise.all(services.map(async (service) => {
            const waitingCount = await Ticket.count({
                where: {
                    service_id: service.id,
                    status: ['waiting', 'pending']
                }
            });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayCount = await Ticket.count({
                where: {
                    service_id: service.id,
                    created_at: { [Op.gte]: today }
                }
            });
            
            return {
                ...service.toJSON(),
                waitingCount: waitingCount || 0,
                todayCount: todayCount || 0,
                isActive: service.is_active !== false
            };
        }));
        
        res.json(servicesWithCount);
    } catch (error) {
        console.error('❌ Erreur services agent:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/agent/recent-activity', auth, isAgent, async (req, res) => {
    try {
        const agentId = req.user.id;
        
        const tickets = await Ticket.findAll({
            where: {
                agent_id: agentId
            },
            order: [['updated_at', 'DESC']],
            limit: 10,
            include: [
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name']
                },
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'first_name', 'last_name']
                }
            ]
        });
        
        const formattedActivity = tickets.map(ticket => ({
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status,
            type: ticket.status === 'completed' ? 'completed' :
                  ticket.status === 'called' ? 'called' :
                  ticket.status === 'cancelled' ? 'cancelled' : 'pending',
            created_at: ticket.created_at,
            client_name: ticket.client ? `${ticket.client.first_name} ${ticket.client.last_name}` : 'Client',
            service_name: ticket.service ? ticket.service.name : 'Service'
        }));
        
        res.json(formattedActivity);
    } catch (error) {
        console.error('❌ Erreur activité récente agent:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== STATUT DE LA FILE POUR L'AGENT ==========
router.get('/agent/queue/:serviceId/status', auth, isAgent, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const agentId = req.user.id;
        
        const service = await Service.findOne({
            where: {
                id: serviceId,
                agent_id: agentId
            }
        });
        
        if (!service) {
            return res.status(403).json({ error: 'Vous n\'avez pas accès à ce service' });
        }
        
        const tickets = await Ticket.findAll({
            where: {
                service_id: serviceId,
                status: { [Op.in]: ['pending', 'waiting', 'called'] }
            },
            order: [
                ['priority', 'DESC'],
                ['position', 'ASC']
            ],
            include: [
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'first_name', 'last_name', 'phone']
                }
            ]
        });
        
        const waiting = tickets.filter(t => t.status === 'waiting' || t.status === 'pending').length;
        const called = tickets.filter(t => t.status === 'called').length;
        
        const completed = await Ticket.count({
            where: {
                service_id: serviceId,
                status: 'completed'
            }
        });
        
        const currentTicket = tickets.find(t => t.status === 'called') || null;
        
        console.log(`📊 [queueStatus] Stats: total=${tickets.length}, waiting=${waiting}, called=${called}, completed=${completed}`);
        
        res.json({
            total: tickets.length,
            waiting: waiting,
            pending: tickets.filter(t => t.status === 'pending').length,
            called: called,
            completed: completed || 0,
            tickets: tickets.map(t => ({
                id: t.id,
                ticket_number: t.ticket_number,
                status: t.status,
                position: t.position,
                estimated_wait_time: t.estimated_wait_time,
                priority: t.priority,
                client: t.client ? {
                    first_name: t.client.first_name,
                    last_name: t.client.last_name,
                    phone: t.client.phone
                } : null,
                created_at: t.created_at
            })),
            currentTicket: currentTicket ? {
                id: currentTicket.id,
                ticket_number: currentTicket.ticket_number,
                status: currentTicket.status,
                position: currentTicket.position,
                estimated_wait_time: currentTicket.estimated_wait_time,
                priority: currentTicket.priority,
                client: currentTicket.client ? {
                    first_name: currentTicket.client.first_name,
                    last_name: currentTicket.client.last_name,
                    phone: currentTicket.client.phone
                } : null
            } : null
        });
    } catch (error) {
        console.error('❌ Erreur statut file agent:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== 🔥 APPELER LE PROCHAIN CLIENT (CORRIGÉ) ==========
router.post('/agent/queue/:serviceId/call-next', auth, isAgent, async (req, res) => {
    console.log('📞 [call-next] Début');
    console.log('📞 serviceId:', req.params.serviceId);
    console.log('📞 agentId:', req.user.id);
    
    try {
        const { serviceId } = req.params;
        const agentId = req.user.id;
        
        const service = await Service.findOne({
            where: {
                id: serviceId,
                agent_id: agentId
            }
        });
        
        if (!service) {
            return res.status(403).json({ error: 'Vous n\'avez pas accès à ce service' });
        }
        
        // Trouver le prochain ticket
        const nextTicket = await Ticket.findOne({
            where: {
                service_id: serviceId,
                status: { [Op.in]: ['pending', 'waiting'] }
            },
            order: [
                ['priority', 'DESC'],
                ['position', 'ASC'],
                ['created_at', 'ASC']
            ],
            include: [
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'first_name', 'last_name', 'phone', 'email']
                }
            ]
        });
        
        if (!nextTicket) {
            return res.status(404).json({ error: 'Aucun ticket en attente' });
        }
        
        // Appeler le ticket
        await nextTicket.update({
            status: 'called',
            called_at: new Date(),
            agent_id: agentId
        });
        
        console.log(`📞 Ticket ${nextTicket.ticket_number} appelé`);
        
        // ========== RECALCULER TOUTES LES POSITIONS ==========
        const remainingTickets = await Ticket.findAll({
            where: {
                service_id: serviceId,
                status: { [Op.in]: ['pending', 'waiting'] }
            },
            order: [
                ['priority', 'DESC'],
                ['position', 'ASC'],
                ['created_at', 'ASC']
            ]
        });
        
        const duration = service.estimated_duration || 15;
        const waitingCount = remainingTickets.length;
        
        for (let i = 0; i < remainingTickets.length; i++) {
            const ticket = remainingTickets[i];
            const newPosition = i + 1;
            const newEstimatedTime = newPosition * duration;
            
            await ticket.update({
                position: newPosition,
                estimated_wait_time: newEstimatedTime
            });
            
            console.log(`📊 Ticket ${ticket.ticket_number} -> Position ${newPosition}, Attente ${newEstimatedTime}min`);
        }
        
        // ========== WEBSOCKET ==========
        try {
            const io = getIO();
            if (io) {
                // 1. Notifier le client appelé
                io.to(`ticket:${nextTicket.id}`).emit('you-are-called', {
                    ticketId: nextTicket.id,
                    ticketNumber: nextTicket.ticket_number,
                    serviceId: serviceId,
                    serviceName: service.name,
                    calledAt: new Date().toISOString(),
                    agentName: req.user.first_name + ' ' + req.user.last_name
                });
                console.log(`📡 you-are-called émis vers ticket:${nextTicket.id}`);

                // 2. Notifier l'agent
                io.to(`agent:${serviceId}`).emit('ticket-called', {
                    ticketId: nextTicket.id,
                    ticketNumber: nextTicket.ticket_number,
                    serviceId: serviceId,
                    calledAt: new Date().toISOString()
                });
                console.log(`📡 ticket-called émis vers agent:${serviceId}`);

                // 3. Mettre à jour les positions de TOUS les tickets restants
                for (let i = 0; i < remainingTickets.length; i++) {
                    const ticket = remainingTickets[i];
                    const newPosition = i + 1;
                    const newEstimatedTime = newPosition * duration;
                    
                    io.to(`ticket:${ticket.id}`).emit('position-update', {
                        ticketId: ticket.id,
                        position: newPosition,
                        waitingCount: waitingCount,
                        estimatedTime: newEstimatedTime,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`📡 position-update émis pour ticket ${ticket.ticket_number}: position ${newPosition}`);
                }

                // 4. Mettre à jour la queue
                io.to(`queue:${serviceId}`).emit('queue-updated', {
                    serviceId: serviceId,
                    waitingCount: waitingCount,
                    calledTicket: nextTicket,
                    timestamp: new Date().toISOString()
                });
                console.log(`📡 queue-updated émis vers queue:${serviceId}`);
            }
        } catch (wsError) {
            console.error('❌ Erreur WebSocket:', wsError);
        }
        
        // ========== EMAIL ==========
        try {
            if (nextTicket.client && nextTicket.client.email) {
                await EmailService.sendTicketCalled(
                    nextTicket.client.email,
                    nextTicket.ticket_number,
                    service.name
                );
                console.log(`📧 Email d'appel envoyé à ${nextTicket.client.email}`);
            }
        } catch (emailError) {
            console.error('❌ Erreur envoi email appel:', emailError);
        }
        
        const client = await User.findByPk(nextTicket.user_id, {
            attributes: ['first_name', 'last_name', 'phone']
        });
        
        res.json({
            id: nextTicket.id,
            ticket_number: nextTicket.ticket_number,
            status: nextTicket.status,
            position: nextTicket.position,
            estimated_wait_time: nextTicket.estimated_wait_time,
            priority: nextTicket.priority,
            user: client ? {
                first_name: client.first_name,
                last_name: client.last_name,
                phone: client.phone
            } : null
        });
        
    } catch (error) {
        console.error('❌ Erreur call-next:', error);
        console.error('📚 Stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// ========== 🔥 COMPLÉTER UN TICKET (CORRIGÉ) ==========
router.put('/agent/tickets/:ticketId/complete', auth, isAgent, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const agentId = req.user.id;
        
        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
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
        
        const service = await Service.findOne({
            where: {
                id: ticket.service_id,
                agent_id: agentId
            }
        });
        
        if (!service) {
            return res.status(403).json({ error: 'Vous n\'avez pas accès à ce ticket' });
        }
        
        if (ticket.status === 'completed') {
            return res.status(400).json({ error: 'Ce ticket est déjà complété' });
        }
        
        await ticket.update({
            status: 'completed',
            completed_at: new Date(),
            agent_id: agentId
        });
        
        // ========== RECALCULER LES POSITIONS ==========
        const remainingTickets = await Ticket.findAll({
            where: {
                service_id: ticket.service_id,
                status: { [Op.in]: ['pending', 'waiting'] }
            },
            order: [
                ['priority', 'DESC'],
                ['position', 'ASC'],
                ['created_at', 'ASC']
            ]
        });
        
        const duration = service.estimated_duration || 15;
        const waitingCount = remainingTickets.length;
        
        for (let i = 0; i < remainingTickets.length; i++) {
            const t = remainingTickets[i];
            const newPosition = i + 1;
            const newEstimatedTime = newPosition * duration;
            
            await t.update({
                position: newPosition,
                estimated_wait_time: newEstimatedTime
            });
            
            console.log(`📊 Ticket ${t.ticket_number} -> Position ${newPosition}, Attente ${newEstimatedTime}min`);
        }
        
        // ========== EMAIL ==========
        try {
            if (ticket.client && ticket.client.email) {
                await EmailService.sendTicketCompleted(
                    ticket.client.email,
                    ticket.ticket_number,
                    ticket.service ? ticket.service.name : 'Service'
                );
                console.log(`📧 Email de service rendu envoyé à ${ticket.client.email}`);
            }
        } catch (emailError) {
            console.error('❌ Erreur envoi email service rendu:', emailError);
        }
        
        // ========== WEBSOCKET ==========
        try {
            const io = getIO();
            if (io) {
                // Notifier le client
                io.to(`ticket:${ticketId}`).emit('ticket-completed', {
                    ticketId: ticket.id,
                    ticketNumber: ticket.ticket_number,
                    serviceId: ticket.service_id
                });
                
                // Mettre à jour les positions de tous les tickets restants
                for (let i = 0; i < remainingTickets.length; i++) {
                    const t = remainingTickets[i];
                    const newPosition = i + 1;
                    const newEstimatedTime = newPosition * duration;
                    
                    io.to(`ticket:${t.id}`).emit('position-update', {
                        ticketId: t.id,
                        position: newPosition,
                        waitingCount: waitingCount,
                        estimatedTime: newEstimatedTime,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`📡 position-update émis pour ticket ${t.ticket_number}: position ${newPosition}`);
                }
                
                io.to(`agent:${ticket.service_id}`).emit('ticket-completed', {
                    ticketId: ticket.id,
                    ticketNumber: ticket.ticket_number,
                    serviceId: ticket.service_id
                });
                
                io.to(`queue:${ticket.service_id}`).emit('queue-updated', {
                    serviceId: ticket.service_id,
                    waitingCount: waitingCount,
                    action: 'ticket-completed'
                });
                console.log(`📡 WebSocket: ticket-completed émis`);
            }
        } catch (wsError) {
            console.error('❌ Erreur WebSocket:', wsError);
        }
        
        res.json({
            message: 'Ticket complété avec succès',
            ticket
        });
    } catch (error) {
        console.error('❌ Erreur complétion ticket:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== 🔥 ANNULER UN TICKET (CORRIGÉ) ==========
router.put('/agent/tickets/:ticketId/cancel', auth, isAgent, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const agentId = req.user.id;
        const { reason } = req.body;
        
        const ticket = await Ticket.findByPk(ticketId, {
            include: [
                {
                    model: User,
                    as: 'client',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
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
        
        const service = await Service.findOne({
            where: {
                id: ticket.service_id,
                agent_id: agentId
            }
        });
        
        if (!service) {
            return res.status(403).json({ error: 'Vous n\'avez pas accès à ce ticket' });
        }
        
        if (ticket.status === 'completed') {
            return res.status(400).json({ error: 'Ce ticket est déjà complété' });
        }
        
        await ticket.update({
            status: 'cancelled',
            cancelled_at: new Date(),
            cancellation_reason: reason || 'agent_cancelled'
        });
        
        // ========== RECALCULER LES POSITIONS ==========
        const remainingTickets = await Ticket.findAll({
            where: {
                service_id: ticket.service_id,
                status: { [Op.in]: ['pending', 'waiting'] }
            },
            order: [
                ['priority', 'DESC'],
                ['position', 'ASC'],
                ['created_at', 'ASC']
            ]
        });
        
        const duration = service.estimated_duration || 15;
        const waitingCount = remainingTickets.length;
        
        for (let i = 0; i < remainingTickets.length; i++) {
            const t = remainingTickets[i];
            const newPosition = i + 1;
            const newEstimatedTime = newPosition * duration;
            
            await t.update({
                position: newPosition,
                estimated_wait_time: newEstimatedTime
            });
            
            console.log(`📊 Ticket ${t.ticket_number} -> Position ${newPosition}, Attente ${newEstimatedTime}min`);
        }
        
        // ========== EMAIL ==========
        try {
            if (ticket.client && ticket.client.email) {
                await EmailService.sendTicketCancelled(
                    ticket.client.email,
                    ticket.ticket_number,
                    ticket.service ? ticket.service.name : 'Service',
                    reason || 'Annulé par l\'agent'
                );
                console.log(`📧 Email d'annulation envoyé à ${ticket.client.email}`);
            }
        } catch (emailError) {
            console.error('❌ Erreur envoi email annulation:', emailError);
        }
        
        // ========== WEBSOCKET ==========
        try {
            const io = getIO();
            if (io) {
                // Notifier le client
                io.to(`ticket:${ticketId}`).emit('ticket-cancelled', {
                    ticketId: ticket.id,
                    ticketNumber: ticket.ticket_number,
                    reason: reason || 'agent_cancelled'
                });
                
                // Mettre à jour les positions de tous les tickets restants
                for (let i = 0; i < remainingTickets.length; i++) {
                    const t = remainingTickets[i];
                    const newPosition = i + 1;
                    const newEstimatedTime = newPosition * duration;
                    
                    io.to(`ticket:${t.id}`).emit('position-update', {
                        ticketId: t.id,
                        position: newPosition,
                        waitingCount: waitingCount,
                        estimatedTime: newEstimatedTime,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`📡 position-update émis pour ticket ${t.ticket_number}: position ${newPosition}`);
                }
                
                io.to(`agent:${ticket.service_id}`).emit('ticket-cancelled', {
                    ticketId: ticket.id,
                    ticketNumber: ticket.ticket_number
                });
                
                io.to(`queue:${ticket.service_id}`).emit('queue-updated', {
                    serviceId: ticket.service_id,
                    waitingCount: waitingCount,
                    action: 'ticket-cancelled'
                });
                console.log(`📡 WebSocket: ticket-cancelled émis`);
            }
        } catch (wsError) {
            console.error('❌ Erreur WebSocket:', wsError);
        }
        
        res.json({
            message: 'Ticket annulé avec succès',
            ticket
        });
    } catch (error) {
        console.error('❌ Erreur annulation ticket:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== HISTORIQUE ==========
router.get('/agent/history', auth, isAgent, async (req, res) => {
    try {
        const agentId = req.user.id;
        const { limit = 50, page = 1, status } = req.query;
        
        const where = { agent_id: agentId };
        if (status && status !== 'all') where.status = status;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        const { count, rows } = await Ticket.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            include: [
                { model: Service, as: 'service', attributes: ['id', 'name'] },
                { model: User, as: 'client', attributes: ['id', 'first_name', 'last_name', 'phone'] }
            ]
        });
        
        const formattedTickets = rows.map(ticket => ({
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status,
            priority: ticket.priority,
            created_at: ticket.created_at,
            completed_at: ticket.completed_at,
            cancelled_at: ticket.cancelled_at,
            estimated_wait_time: ticket.estimated_wait_time,
            service_name: ticket.service ? ticket.service.name : null,
            user: ticket.client ? {
                first_name: ticket.client.first_name,
                last_name: ticket.client.last_name,
                phone: ticket.client.phone
            } : null
        }));
        
        res.json({
            tickets: formattedTickets,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (error) {
        console.error('❌ Erreur historique agent:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/agent/history/export', auth, isAgent, async (req, res) => {
    try {
        const agentId = req.user.id;
        const { status, date } = req.query;
        
        const where = { agent_id: agentId };
        if (status && status !== 'all') where.status = status;
        
        if (date && date !== 'all') {
            const now = new Date();
            let startDate = new Date();
            if (date === 'today') startDate.setHours(0, 0, 0, 0);
            else if (date === 'week') startDate.setDate(startDate.getDate() - 7);
            else if (date === 'month') startDate.setMonth(startDate.getMonth() - 1);
            where.created_at = { [Op.gte]: startDate };
        }
        
        const tickets = await Ticket.findAll({
            where,
            order: [['created_at', 'DESC']],
            include: [
                { model: Service, as: 'service', attributes: ['name'] },
                { model: User, as: 'client', attributes: ['first_name', 'last_name', 'phone'] }
            ]
        });
        
        let csv = 'Numéro,Client,Téléphone,Service,Statut,Créé le,Complété le,Temps attente\n';
        tickets.forEach(t => {
            const row = [
                t.ticket_number || '',
                t.client ? `${t.client.first_name || ''} ${t.client.last_name || ''}` : 'Client',
                t.client ? t.client.phone || '' : '',
                t.service ? t.service.name || '' : '',
                t.status || '',
                t.created_at ? new Date(t.created_at).toLocaleString('fr-FR') : '',
                t.completed_at ? new Date(t.completed_at).toLocaleString('fr-FR') : '',
                t.estimated_wait_time || 0
            ];
            csv += row.join(',') + '\n';
        });
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=historique_agent_${Date.now()}.csv`);
        res.send(csv);
        
    } catch (error) {
        console.error('❌ Erreur export historique:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/agent/profile', auth, isAgent, async (req, res) => {
    console.log('📝 [PROFILE] Mise à jour du profil agent');
    
    try {
        const agentId = req.user.id;
        const { first_name, last_name, phone } = req.body;
        
        const agent = await User.findByPk(agentId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }
        
        await agent.update({
            first_name: first_name || agent.first_name,
            last_name: last_name || agent.last_name,
            phone: phone || agent.phone
        });
        
        console.log('✅ Profil mis à jour pour:', agent.email);
        
        res.json({
            message: 'Profil mis à jour avec succès',
            user: {
                id: agent.id,
                email: agent.email,
                first_name: agent.first_name,
                last_name: agent.last_name,
                phone: agent.phone,
                role: agent.role,
                company_id: agent.company_id,
                status: agent.status
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur mise à jour profil:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
