import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// 🔥 Créer un agent (Company Admin)
export const createAgent = async (req, res) => {
  try {
    const { 
      email, phone, firstName, lastName, 
      serviceIds, workSchedule 
    } = req.body;
    
    const companyId = req.user.companyId;

    // Vérifier si l'agent existe déjà
    const existingAgent = await User.findOne({
      where: { 
        [Op.or]: [{ email }, { phone }],
        role: 'agent',
        companyId
      }
    });

    if (existingAgent) {
      return res.status(400).json({ 
        error: 'Un agent avec cet email ou téléphone existe déjà' 
      });
    }

    // Générer un mot de passe aléatoire
    const password = Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'agent
    const agent = await User.create({
      id: uuidv4(),
      email,
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'agent',
      companyId,
      agentCode: `AG-${Date.now().toString().slice(-6)}`,
      assignedServiceIds: serviceIds || [],
      workSchedule: workSchedule || {
        monday: { start: '08:00', end: '17:00', active: true },
        tuesday: { start: '08:00', end: '17:00', active: true },
        wednesday: { start: '08:00', end: '17:00', active: true },
        thursday: { start: '08:00', end: '17:00', active: true },
        friday: { start: '08:00', end: '17:00', active: true },
        saturday: { start: null, end: null, active: false },
        sunday: { start: null, end: null, active: false }
      },
      status: 'active',
      phoneVerified: true,
      emailVerified: true
    });

    res.status(201).json({
      success: true,
      message: 'Agent créé avec succès',
      agent: {
        id: agent.id,
        email: agent.email,
        phone: agent.phone,
        firstName: agent.firstName,
        lastName: agent.lastName,
        agentCode: agent.agentCode,
        assignedServiceIds: agent.assignedServiceIds
      },
      temporaryPassword: password // ⚠️ À envoyer par email sécurisé
    });

  } catch (error) {
    console.error('Erreur création agent:', error);
    res.status(400).json({ error: error.message });
  }
};

// 🔥 Obtenir tous les agents de l'entreprise
export const getCompanyAgents = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { status, search } = req.query;
    const where = {
      companyId,
      role: 'agent'
    };

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { agentCode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const agents = await User.findAll({
      where,
      attributes: {
        exclude: ['password']
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: agents.length,
      agents
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: error.message });
  }
};

// 🔥 Assigner un agent à un service
export const assignServiceToAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceId } = req.body;
    const companyId = req.user.companyId;

    const agent = await User.findOne({
      where: { id, companyId, role: 'agent' }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent non trouvé' });
    }

    if (!agent.assignedServiceIds.includes(serviceId)) {
      agent.assignedServiceIds.push(serviceId);
      await agent.save();
    }

    res.json({
      success: true,
      message: 'Agent assigné au service',
      assignedServiceIds: agent.assignedServiceIds
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: error.message });
  }
};

// 🔥 Désassigner un agent d'un service
export const unassignServiceFromAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceId } = req.body;
    const companyId = req.user.companyId;

    const agent = await User.findOne({
      where: { id, companyId, role: 'agent' }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent non trouvé' });
    }

    agent.assignedServiceIds = agent.assignedServiceIds.filter(
      s => s !== serviceId
    );
    await agent.save();

    res.json({
      success: true,
      message: 'Agent désassigné du service',
      assignedServiceIds: agent.assignedServiceIds
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: error.message });
  }
};