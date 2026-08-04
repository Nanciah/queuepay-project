import Company from '../models/Company.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// 🔥 Créer une entreprise (Super Admin uniquement)
export const createCompany = async (req, res) => {
  try {
    const { 
      name, description, address, city, phone, email,
      adminEmail, adminPhone, adminFirstName, adminLastName 
    } = req.body;

    // Vérifier si l'entreprise existe déjà
    const existingCompany = await Company.findOne({ where: { name } });
    if (existingCompany) {
      return res.status(400).json({ error: 'Cette entreprise existe déjà' });
    }

    // Créer l'entreprise
    const company = await Company.create({
      id: uuidv4(),
      name,
      description,
      address,
      city,
      phone,
      email,
      status: 'active'
    });

    // Créer l'admin de l'entreprise
    const adminPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      id: uuidv4(),
      email: adminEmail,
      phone: adminPhone || '0340000000',
      password: hashedPassword,
      firstName: adminFirstName || 'Admin',
      lastName: adminLastName || name,
      role: 'company_admin',
      companyId: company.id,
      phoneVerified: true,
      emailVerified: true,
      status: 'active'
    });

    res.status(201).json({
      success: true,
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
        password: adminPassword // ⚠️ À envoyer par email sécurisé
      }
    });

  } catch (error) {
    console.error('Erreur création entreprise:', error);
    res.status(400).json({ error: error.message });
  }
};

// 🔥 Obtenir toutes les entreprises
export const getAllCompanies = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const companies = await Company.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'admins',
        where: { role: 'company_admin' },
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        required: false
      }]
    });

    res.json({
      success: true,
      count: companies.length,
      companies
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: error.message });
  }
};

// 🔥 Obtenir une entreprise par ID
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByPk(id, {
      include: [{
        model: User,
        as: 'admins',
        where: { role: 'company_admin' },
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        required: false
      }]
    });

    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    res.json({ success: true, company });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: error.message });
  }
};

// 🔥 Mettre à jour une entreprise
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, city, phone, email, status, settings, theme } = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    await company.update({
      name: name || company.name,
      description: description !== undefined ? description : company.description,
      address: address !== undefined ? address : company.address,
      city: city !== undefined ? city : company.city,
      phone: phone !== undefined ? phone : company.phone,
      email: email !== undefined ? email : company.email,
      status: status || company.status,
      settings: settings || company.settings,
      theme: theme || company.theme
    });

    res.json({
      success: true,
      message: 'Entreprise mise à jour',
      company
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: error.message });
  }
};

// 🔥 Supprimer une entreprise
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    // Supprimer aussi les utilisateurs associés
    await User.destroy({ where: { companyId: id } });
    await company.destroy();

    res.json({
      success: true,
      message: 'Entreprise supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({ error: error.message });
  }
};