import sequelize from '../config/database.js';

const activateUser = async () => {
    try {
        await sequelize.authenticate();
        console.log('📦 Connexion à la base de données réussie');

        const email = 'admin@queuepay.mg'; // 🔥 Mets l'email que tu utilises

        // 🔥 Utiliser SQL direct en snake_case
        const result = await sequelize.query(
            'UPDATE users SET is_active = true WHERE email = :email RETURNING id, email, is_active',
            {
                replacements: { email },
                type: sequelize.QueryTypes.UPDATE
            }
        );

        console.log(`✅ Utilisateur ${email} activé avec succès`);
        console.log('   Résultat:', result);

        // Vérifier
        const users = await sequelize.query(
            'SELECT id, email, is_active FROM users',
            { type: sequelize.QueryTypes.SELECT }
        );

        console.log('\n📋 Liste des utilisateurs:');
        users.forEach(user => {
            console.log(`   ${user.email} - is_active: ${user.is_active}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
};

activateUser();