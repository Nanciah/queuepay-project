import express from 'express';
import { isSuperAdmin } from '../middleware/auth.js';
import * as companyController from '../controllers/companyController.js';
import * as userController from '../controllers/userController.js';
import * as statsController from '../controllers/statsController.js';

const router = express.Router();

// 🔥 Toutes les routes Super Admin sont protégées
router.use(isSuperAdmin);

// Gestion des entreprises
router.post('/companies', companyController.createCompany);
router.get('/companies', companyController.getAllCompanies);
router.get('/companies/:id', companyController.getCompanyById);
router.put('/companies/:id', companyController.updateCompany);
router.delete('/companies/:id', companyController.deleteCompany);

// Gestion des admins d'entreprises
router.post('/companies/:companyId/admins', userController.createCompanyAdmin);
router.get('/companies/:companyId/admins', userController.getCompanyAdmins);
router.put('/admins/:userId', userController.updateCompanyAdmin);
router.delete('/admins/:userId', userController.deleteCompanyAdmin);

// Gestion des utilisateurs
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id/suspend', userController.suspendUser);
router.put('/users/:id/activate', userController.activateUser);

// Statistiques globales
router.get('/stats/global', statsController.getGlobalStats);
router.get('/stats/revenue', statsController.getRevenueStats);

// Configuration système
router.put('/settings', statsController.updateSystemSettings);
router.get('/settings', statsController.getSystemSettings);

export default router;