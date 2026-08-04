import sequelize from '../config/database.js';
import User from '../models/User.js';

const checkUser = async () => {
    try {
        await sequelize.authenticate();
        console.log('📦 Connexion à la base de données réussie');

        // 🔥 Utiliser le modèle avec les bons noms de champs
        const users = await User.findAll({
            attributes: [
                ['id', 'id'],
                ['email', 'email'],
                ['first_name', 'firstName'],  // 🔥 Mapping snake_case -> camelCase
                ['is_active', 'isActive'],    // 🔥 Mapping snake_case -> camelCase
                ['status', 'status'],
                ['role', 'role']
            ],
            raw: true
        });

        console.log('\n📋 Liste des utilisateurs:');
        users.forEach(user => {
            console.log(`   ${user.email} - isActive: ${user.isActive}, status: ${user.status || 'N/A'}, role: ${user.role}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};

checkUser();