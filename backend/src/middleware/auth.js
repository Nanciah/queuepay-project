import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentification requise' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        // ✅ CORRECTION : Utiliser status (comme dans la base de données)
        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ error: 'Compte désactivé' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Token invalide' });
    }
};