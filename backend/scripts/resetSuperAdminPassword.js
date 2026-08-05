// scripts/resetSuperAdminPassword.js
//
// Usage : node scripts/resetSuperAdminPassword.js
// Réinitialise le mot de passe du compte super_admin (0340000000)
// en passant par Sequelize, pour que le hook de hash du modèle User s'applique.

const { User } = require('../src/models');

const PHONE = '0340000000';
const NEW_PASSWORD = 'superadmin123';

(async () => {
    try {
        const user = await User.findOne({ where: { phone: PHONE } });

        if (!user) {
            console.log(`❌ Aucun utilisateur trouvé avec le numéro ${PHONE}`);
            process.exit(1);
        }

        if (user.role !== 'super_admin') {
            console.log(`⚠️ Attention : cet utilisateur a le rôle "${user.role}", pas "super_admin".`);
        }

        // On passe par .update() pour déclencher les hooks Sequelize (hash automatique)
        await user.update({ password_hash: NEW_PASSWORD });

        console.log(`✅ Mot de passe réinitialisé pour ${user.first_name} ${user.last_name} (${user.phone})`);
        console.log(`   Nouveau mot de passe : ${NEW_PASSWORD}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
})();