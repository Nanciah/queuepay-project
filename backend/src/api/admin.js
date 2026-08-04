import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/User.js';
import Entity from '../models/Entity.js';
import Service from '../models/Service.js';
import Ticket from '../models/Ticket.js';
import Transaction from '../models/Transaction.js';
import EmailService from '../services/EmailService.js';
import { auth } from '../middleware/auth.js';
import { emitCompanyCreated, emitCompanyUpdated, emitCompanyDeleted } from '../sockets/index.js';

const router = express.Router();

// Middleware pour Company Admin
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

// ========== STATISTIQUES ==========
router.get('/stats', async (req, res) => {
    try {
        const totalCompanies = await Entity.count();
        const totalUsers = await User.count();
        const totalTickets = await Ticket.count();
        const totalRevenue = await Transaction.sum('amount', { 
            where: { type: 'ticket_purchase', status: 'success' }
        });

        res.json({
            totalCompanies: totalCompanies || 0,
            totalUsers: totalUsers || 0,
            totalTickets: totalTickets || 0,
            totalRevenue: totalRevenue || 0
        });
    } catch (error) {
        console.error('❌ Erreur stats:', error);
        res.json({
            totalCompanies: await Entity.count() || 0,
            totalUsers: await User.count() || 0,
            totalTickets: 0,
            totalRevenue: 0
        });
    }
});

// ========== ENTREPRISES ==========
router.get('/companies', async (req, res) => {
    try {
        const companies = await Entity.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                as: 'users',
                where: { role: 'company_admin' },
                attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
                required: false
            }]
        });
        res.json({ companies });
    } catch (error) {
        console.error('❌ Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/companies', async (req, res) => {
    try {
        console.log('📝 [ADMIN] Route POST /companies appelée');
        const { 
            name, description, address, city, phone, email,
            adminEmail, adminPhone, adminFirstName, adminLastName 
        } = req.body;

        const existing = await Entity.findOne({ where: { name } });
        if (existing) {
            return res.status(400).json({ error: 'Cette entreprise existe déjà' });
        }

        const company = await Entity.create({
            id: uuidv4(),
            name,
            description,
            address,
            city,
            phone,
            email,
            status: 'active'
        });
        console.log('✅ [ADMIN] Entreprise créée:', company.id, company.name);
        console.log('📢 [ADMIN] Émission de company-created...');
        emitCompanyCreated(company);

        const adminPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const admin = await User.create({
            id: uuidv4(),
            email: adminEmail || `admin@${name.toLowerCase().replace(/\s/g, '')}.com`,
            phone: adminPhone || '0340000000',
            password: hashedPassword,
            first_name: adminFirstName || 'Admin',
            last_name: adminLastName || name,
            role: 'company_admin',
            company_id: company.id,
            status: 'active',
            phone_verified: true,
            email_verified: true
        });

        try {
            await EmailService.sendCredentialsEmail(
                admin.email,
                adminPassword,
                company.name,
                `${admin.first_name} ${admin.last_name}`
            );
            console.log(`✅ Email envoyé à: ${admin.email}`);
        } catch (emailError) {
            console.error('❌ Erreur envoi email:', emailError);
        }

        res.status(201).json({
            message: 'Entreprise créée avec succès',
            company: {
                id: company.id,
                name: company.name,
                status: company.status
            },
            admin: {
                id: admin.id,
                email: admin.email,
                phone: admin.phone,
                password: adminPassword
            }
        });

    } catch (error) {
        console.error('❌ Erreur création entreprise:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== RÉCUPÉRER LES AGENTS D'UNE ENTREPRISE ==========
router.get('/companies/:id/agents', async (req, res) => {
    try {
        const { id } = req.params;
        
        const company = await Entity.findByPk(id);
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        
        const agents = await User.findAll({
            where: { 
                company_id: id, 
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
        console.error('❌ Erreur récupération agents:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== RÉCUPÉRER LES SERVICES D'UNE ENTREPRISE ==========
router.get('/companies/:id/services', async (req, res) => {
    try {
        const { id } = req.params;
        
        const company = await Entity.findByPk(id);
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        
        const services = await Service.findAll({
            where: { 
                entity_id: id 
            },
            order: [['createdAt', 'DESC']]
        });
        
        res.json({ services });
    } catch (error) {
        console.error('❌ Erreur récupération services:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/companies/:id', async (req, res) => {
    try {
        const company = await Entity.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'users',
                where: { role: 'company_admin' },
                attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
                required: false
            }]
        });
        
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        
        res.json({ company });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/companies/:id', async (req, res) => {
    try {
        console.log('📝 [ADMIN] Route PUT /companies/:id appelée');
        const company = await Entity.findByPk(req.params.id);
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        const { name, description, address, city, phone, email, status } = req.body;
        await company.update({ name, description, address, city, phone, email, status });
        emitCompanyUpdated(company);
        
        res.json({ message: 'Entreprise mise à jour', company });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const company = await Entity.findByPk(id);
        if (!company) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        const companyName = company.name;

        const deletedUsers = await User.destroy({ 
            where: { company_id: id } 
        });
        console.log(`🗑️ ${deletedUsers} utilisateur(s) supprimés`);

        await company.destroy();
        emitCompanyDeleted(id, companyName);

        res.json({ 
            message: `Entreprise et ${deletedUsers} utilisateur(s) supprimés avec succès`,
            deletedUsers: deletedUsers
        });
    } catch (error) {
        console.error('❌ Erreur suppression entreprise:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== UTILISATEURS ==========
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            where: {
                role: {
                    [Op.not]: 'super_admin'
                }
            },
            include: [{
                model: Entity,
                as: 'company',
                attributes: ['id', 'name', 'status']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ users });
    } catch (error) {
        console.error('❌ Erreur récupération utilisateurs:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/users/:id/suspend', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        await user.update({ status: 'suspended' });
        res.json({ message: 'Utilisateur suspendu' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/users/:id/activate', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        await user.update({ status: 'active' });
        res.json({ message: 'Utilisateur activé' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== TRANSACTIONS ==========
// ========== TRANSACTIONS ==========
router.get('/transactions', async (req, res) => {
    try {
        console.log('🔍 [ADMIN] Récupération des transactions');
        
        const { type, status, search, page = 1, limit = 10 } = req.query;
        
        const where = {};
        if (type && type !== 'all' && type !== 'undefined') {
            where.type = type;
        }
        if (status && status !== 'all' && status !== 'undefined') {
            where.status = status;
        }
        
        if (search && search.trim()) {
            where[Op.or] = [
                { reference: { [Op.like]: `%${search.trim()}%` } },
                { '$user.email$': { [Op.like]: `%${search.trim()}%` } },
                { '$user.first_name$': { [Op.like]: `%${search.trim()}%` } },
                { '$user.last_name$': { [Op.like]: `%${search.trim()}%` } }
            ];
        }
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // ✅ Récupérer les transactions avec les relations
        const { count, rows } = await Transaction.findAndCountAll({
            where,
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'company_id'] 
                },
                // ✅ MAINTENANT ON PEUT INCLURE COMPANY DIRECTEMENT !
                { 
                    model: Entity, 
                    as: 'company', 
                    attributes: ['id', 'name', 'email', 'phone'] 
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });
        
        console.log(`✅ ${rows.length} transactions trouvées sur ${count} total`);
        
        // ✅ Formater la réponse
        const transactions = rows.map(tx => {
            const txJson = tx.toJSON();
            
            return {
                id: txJson.id,
                reference: txJson.reference || txJson.id,
                type: txJson.type,
                amount: parseFloat(txJson.amount) || 0,
                fee: parseFloat(txJson.fee) || 0,
                status: txJson.status,
                payment_method: txJson.payment_method,
                provider: txJson.provider || txJson.payment_method,
                description: txJson.description,
                user: txJson.user ? {
                    id: txJson.user.id,
                    first_name: txJson.user.first_name,
                    last_name: txJson.user.last_name,
                    email: txJson.user.email,
                    phone: txJson.user.phone
                } : null,
                company: txJson.company ? {
                    id: txJson.company.id,
                    name: txJson.company.name,
                    email: txJson.company.email,
                    phone: txJson.company.phone
                } : null,
                createdAt: txJson.createdAt || txJson.created_at,
                updatedAt: txJson.updatedAt || txJson.updated_at
            };
        });
        
        res.json({
            transactions: transactions,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération transactions:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des transactions',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'company_id'] 
                }
            ]
        });
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction non trouvée' });
        }
        
        let companyName = null;
        if (transaction.user && transaction.user.company_id) {
            const company = await Entity.findByPk(transaction.user.company_id, {
                attributes: ['name']
            });
            companyName = company ? company.name : null;
        }
        
        res.json({ 
            transaction: {
                ...transaction.toJSON(),
                company: companyName ? { name: companyName } : null,
                provider: transaction.provider || null
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération transaction:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/transactions/export', async (req, res) => {
    try {
        const { type, status, startDate, endDate } = req.query;
        
        const where = {};
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
                tx.provider || '',
                tx.createdAt
            ];
            csv += row.join(',') + '\n';
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('❌ Erreur export:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== FILES D'ATTENTE ==========
router.get('/queues', async (req, res) => {
    try {
        const services = await Service.findAll({
            where: { is_active: true },
            include: [
                { 
                    model: Entity, 
                    as: 'entity', 
                    attributes: ['id', 'name'] 
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        const queues = await Promise.all(services.map(async (service) => {
            const waiting = await Ticket.count({
                where: {
                    service_id: service.id,
                    status: ['waiting', 'pending']
                }
            });
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTickets = await Ticket.count({
                where: {
                    service_id: service.id,
                    created_at: { [Op.gte]: today }
                }
            });
            
            return {
                id: service.id,
                name: service.name,
                service_id: service.id,
                company_name: service.entity?.name || null,
                status: service.is_active ? 'active' : 'closed',
                waiting: waiting,
                today: todayTickets,
                avg_wait: Math.round(waiting * (service.duration || 5)),
                capacity: service.capacity || 50,
                duration: service.duration || 5
            };
        }));
        
        res.json({ queues });
    } catch (error) {
        console.error('❌ Erreur récupération files:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== DÉTAILS D'UNE FILE D'ATTENTE ==========
router.get('/queues/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const service = await Service.findByPk(id, {
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
        
        const waiting = await Ticket.count({
            where: {
                service_id: service.id,
                status: ['waiting', 'pending']
            }
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTickets = await Ticket.count({
            where: {
                service_id: service.id,
                created_at: { [Op.gte]: today }
            }
        });
        
        const tickets = await Ticket.findAll({
            where: {
                service_id: service.id,
                status: ['waiting', 'pending', 'called']
            },
            attributes: { 
                exclude: ['priority', 'completed_at', 'called_at', 'cancelled_at', 'estimated_wait_time'] 
            },
            include: [
                { 
                    model: User, 
                    as: 'user', 
                    attributes: ['id', 'first_name', 'last_name', 'email'] 
                }
            ],
            order: [['position', 'ASC']],
            limit: 20
        });
        
        const queue = {
            id: service.id,
            name: service.name,
            service_id: service.id,
            company_name: service.entity?.name || null,
            status: service.is_active ? 'active' : 'closed',
            waiting: waiting,
            today: todayTickets,
            avg_wait: Math.round(waiting * (service.duration || 5)),
            capacity: service.capacity || 50,
            duration: service.duration || 5
        };
        
        res.json({ queue, tickets });
    } catch (error) {
        console.error('❌ Erreur récupération file:', error);
        res.status(500).json({ error: error.message });
    }
});

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

// ========== EXPORT DES RAPPORTS ==========
router.get('/reports/export', async (req, res) => {
    try {
        const { type, format = 'csv' } = req.query;

        let data = [];
        let filename = `rapport_${type}_${Date.now()}`;

        switch (type) {
            case 'utilisateurs':
                data = await User.findAll({
                    attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'role', 'status', 'created_at'],
                    where: {
                        role: {
                            [Op.not]: 'super_admin'
                        }
                    }
                });
                filename += '_utilisateurs';
                break;

            case 'entreprises':
                data = await Entity.findAll({
                    attributes: ['id', 'name', 'description', 'address', 'city', 'phone', 'email', 'status', 'created_at']
                });
                filename += '_entreprises';
                break;

            case 'tickets':
                data = await Ticket.findAll({
                    include: [
                        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
                        { model: Service, as: 'service', attributes: ['name'] }
                    ],
                    order: [['createdAt', 'DESC']],
                    limit: 1000
                });
                filename += '_tickets';
                break;

            case 'revenus':
                data = await Transaction.findAll({
                    where: { type: 'ticket_purchase', status: 'success' },
                    include: [
                        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] }
                    ],
                    order: [['createdAt', 'DESC']],
                    limit: 1000
                });
                filename += '_revenus';
                break;

            case 'activite':
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const totalUsers = await User.count();
                const totalCompanies = await Entity.count();
                const totalTickets = await Ticket.count();
                const todayTickets = await Ticket.count({
                    where: {
                        created_at: { [Op.gte]: today }
                    }
                });
                
                data = [{
                    'Total Utilisateurs': totalUsers,
                    'Total Entreprises': totalCompanies,
                    'Total Tickets': totalTickets,
                    'Tickets Aujourd\'hui': todayTickets,
                    'Date': new Date().toLocaleDateString('fr-FR')
                }];
                filename += '_activite';
                break;

            default:
                return res.status(400).json({ error: 'Type de rapport invalide' });
        }

        if (format === 'csv') {
            let csv = '';
            
            if (Array.isArray(data) && data.length > 0) {
                const headers = Object.keys(data[0].toJSON ? data[0].toJSON() : data[0]);
                csv = headers.join(',') + '\n';
                
                data.forEach(item => {
                    const row = headers.map(header => {
                        let value = item[header];
                        if (item.toJSON) {
                            const json = item.toJSON();
                            value = json[header];
                        }
                        if (value === null || value === undefined) return '';
                        if (typeof value === 'string' && value.includes(',')) {
                            return `"${value}"`;
                        }
                        if (value instanceof Date) {
                            return value.toISOString();
                        }
                        return value;
                    });
                    csv += row.join(',') + '\n';
                });
            } else if (data.length === 0) {
                csv = 'Aucune donnée disponible\n';
            } else {
                const headers = Object.keys(data[0]);
                csv = headers.join(',') + '\n';
                const row = headers.map(h => data[0][h]);
                csv += row.join(',') + '\n';
            }

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
            return res.send(csv);
        }

        res.json({ data });

    } catch (error) {
        console.error('❌ Erreur export:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;