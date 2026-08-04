import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import emailService from '../services/emailService.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ========== REGISTER ==========
router.post('/register', async (req, res) => {
    console.log('📝 [REGISTER] Début de l\'inscription');
    
    try {
        const { email, password, first_name, last_name, phone, role } = req.body;

        console.log(`📧 [REGISTER] Email: ${email}`);
        console.log(`👤 [REGISTER] Nom: ${first_name} ${last_name}`);

        // 1. Validation
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({ 
                error: 'Tous les champs sont requis (email, password, first_name, last_name)' 
            });
        }

        // 2. Vérifier si l'utilisateur existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        // 3. Vérifier la longueur du mot de passe
        if (password.length < 8) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
        }

        // 4. Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Créer l'utilisateur
        const user = await User.create({
            email,
            password: hashedPassword,
            first_name,
            last_name,
            phone: phone || '',
            role: role || 'client',
            status: 'active',
            phone_verified: true,
            email_verified: true,
        });

        console.log(`✅ [REGISTER] Utilisateur créé avec ID: ${user.id}`);

        // ========== 🔥 ENVOI EMAIL DE BIENVENUE ==========
        try {
            await emailService.sendWelcomeEmail(
                user.email,
                user.first_name,
                user.last_name
            );
            console.log(`📧 Email de bienvenue envoyé à ${user.email}`);
        } catch (emailError) {
            console.error('⚠️ Erreur envoi email bienvenue:', emailError.message);
            // Ne pas bloquer l'inscription
        }

        // 6. Générer le token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        console.log('✅ [REGISTER] Inscription réussie');
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                status: user.status,
            },
        });

    } catch (error) {
        console.error('❌ [REGISTER] Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    console.log('🔐 [LOGIN] Début de la requête');
    
    try {
        console.log('🔐 [LOGIN] 1 - Récupération du body');
        const { email, password } = req.body;

        console.log(`🔐 [LOGIN] 2 - Email: ${email}`);

        if (!email || !password) {
            console.log('🔐 [LOGIN] 3 - Email ou mot de passe manquant');
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        console.log('🔐 [LOGIN] 4 - Recherche de l\'utilisateur...');
        const user = await User.findOne({ where: { email } });
        
        console.log(`🔐 [LOGIN] 5 - Utilisateur trouvé: ${user ? 'OUI' : 'NON'}`);
        
        if (!user) {
            console.log('🔐 [LOGIN] 6 - Utilisateur non trouvé');
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        console.log('🔐 [LOGIN] 7 - Vérification du mot de passe...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`🔐 [LOGIN] 8 - Mot de passe valide: ${isPasswordValid}`);

        if (!isPasswordValid) {
            console.log('🔐 [LOGIN] 9 - Mot de passe incorrect');
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        console.log(`🔐 [LOGIN] 10 - Status: ${user.status}`);

        if (user.status !== 'active') {
            console.log('🔐 [LOGIN] 11 - Compte désactivé');
            return res.status(401).json({ error: 'Compte désactivé' });
        }

        console.log('🔐 [LOGIN] 12 - Génération du token...');
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        console.log('🔐 [LOGIN] 13 - Token généré');

        console.log('🔐 [LOGIN] 14 - Envoi de la réponse');
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                company_id: user.company_id,
                status: user.status,
            },
        });

        console.log('🔐 [LOGIN] 15 - Réponse envoyée avec succès');

    } catch (error) {
        console.error('❌ [LOGIN] Erreur:', error);
        console.error('📚 Stack:', error.stack);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// ========== CHANGER LE MOT DE PASSE ==========
router.put('/change-password', auth, async (req, res) => {
    console.log('📝 [CHANGE-PASSWORD] Tentative de changement de mot de passe');
    
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        console.log(`👤 [CHANGE-PASSWORD] Utilisateur ID: ${userId}`);
        console.log(`📧 [CHANGE-PASSWORD] Email: ${req.user.email}`);

        // 1. Vérifier que tous les champs sont présents
        if (!currentPassword || !newPassword || !confirmPassword) {
            console.log('❌ [CHANGE-PASSWORD] Champs manquants');
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        // 2. Vérifier que les mots de passe correspondent
        if (newPassword !== confirmPassword) {
            console.log('❌ [CHANGE-PASSWORD] Les mots de passe ne correspondent pas');
            return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
        }

        // 3. Vérifier que le nouveau mot de passe est différent
        if (currentPassword === newPassword) {
            console.log('❌ [CHANGE-PASSWORD] Le nouveau mot de passe est identique');
            return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'ancien' });
        }

        // 4. Vérifier la longueur du mot de passe
        if (newPassword.length < 8) {
            console.log('❌ [CHANGE-PASSWORD] Mot de passe trop court');
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
        }

        // 5. Récupérer l'utilisateur
        console.log('🔍 [CHANGE-PASSWORD] Recherche de l\'utilisateur...');
        const user = await User.findByPk(userId);
        
        if (!user) {
            console.log('❌ [CHANGE-PASSWORD] Utilisateur non trouvé');
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // 6. Vérifier le mot de passe actuel
        console.log('🔑 [CHANGE-PASSWORD] Vérification du mot de passe actuel...');
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        console.log(`✅ [CHANGE-PASSWORD] Mot de passe valide: ${isPasswordValid}`);

        if (!isPasswordValid) {
            console.log('❌ [CHANGE-PASSWORD] Mot de passe actuel incorrect');
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }

        // 7. Hacher le nouveau mot de passe
        console.log('🔑 [CHANGE-PASSWORD] Hachage du nouveau mot de passe...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 8. Mettre à jour
        await user.update({ password: hashedPassword });

        console.log(`✅ [CHANGE-PASSWORD] Mot de passe modifié pour: ${user.email}`);
        res.json({
            message: 'Mot de passe modifié avec succès',
            success: true,
        });

    } catch (error) {
        console.error('❌ [CHANGE-PASSWORD] Erreur:', error);
        console.error('📚 Stack:', error.stack);
        res.status(500).json({ 
            error: 'Erreur serveur', 
            details: error.message 
        });
    }
});
// ========== MOT DE PASSE OUBLIÉ - ENVOI NOUVEAU MOT DE PASSE ==========
router.post('/forgot-password', async (req, res) => {
    console.log('🚀 Route forgot-password appelée');
    
    try {
        const { email } = req.body;

        console.log(`📧 Email reçu: ${email}`);

        if (!email) {
            return res.status(400).json({ error: 'L\'email est requis' });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            console.log('⚠️ Email non trouvé');
            return res.json({
                message: 'Si cet email existe, un nouveau mot de passe a été envoyé',
                success: true,
            });
        }

        // Générer un nouveau mot de passe aléatoire
        const newPassword = generateRandomPassword();
        console.log(`🔑 Nouveau mot de passe généré: ${newPassword}`);

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Mettre à jour le mot de passe de l'utilisateur
        await user.update({ password: hashedPassword });

        console.log(`✅ Mot de passe mis à jour pour: ${user.email}`);

        // ✅ Utiliser first_name (snake_case)
        const userName = user.first_name || user.email || 'Utilisateur';
        console.log(`👤 Nom de l'utilisateur: ${userName}`);

        // Envoyer l'email avec le nouveau mot de passe
        const emailSent = await emailService.sendNewPasswordEmail(
            email, 
            newPassword, 
            userName
        );

        if (!emailSent.success) {
            console.error('❌ Erreur envoi email:', emailSent.error);
            return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
        }

        console.log(`✅ Email envoyé à ${email}`);
        res.json({
            message: 'Un nouveau mot de passe a été envoyé à votre email',
            success: true,
        });

    } catch (error) {
        console.error('❌ Erreur forgot-password:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// 🔥 Fonction pour générer un mot de passe aléatoire
function generateRandomPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

// ========== VÉRIFIER LE TOKEN ==========
router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Token requis' });
        }

        const reset = await PasswordReset.findOne({
            where: {
                token,
                used: false,
                expiresAt: { [Op.gt]: new Date() },
            },
        });

        if (!reset) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }

        res.json({
            valid: true,
            email: reset.email,
        });

    } catch (error) {
        console.error('❌ Erreur verify-reset-token:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ========== RÉINITIALISER LE MOT DE PASSE ==========
router.post('/reset-password', async (req, res) => {
    // ... ton code ...
});

export default router;