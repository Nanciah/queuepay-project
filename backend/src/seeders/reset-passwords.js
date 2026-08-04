const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  try {
    console.log('🔄 Réinitialisation des mots de passe...');

    // Liste des utilisateurs avec leurs nouveaux mots de passe
    const users = [
      { phone: '0340000000', password: 'admin123' },
      { phone: '0341111111', password: 'admin123' },
      { phone: '0341234567', password: 'client123' },
      { phone: '0341234568', password: 'client123' },
      { phone: '0341234569', password: 'client123' }
    ];

    for (const userData of users) {
      const user = await User.findOne({ where: { phone: userData.phone } });
      if (user) {
        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        user.password_hash = hashedPassword;
        await user.save();
        console.log(`✅ Mot de passe réinitialisé pour ${userData.phone} → ${userData.password}`);
      } else {
        console.log(`❌ Utilisateur ${userData.phone} non trouvé`);
      }
    }

    console.log('\n🎉 Réinitialisation terminée !');
    console.log('\n📋 Identifiants de test:');
    console.log('   Super Admin: 0340000000 / admin123');
    console.log('   Admin Métier: 0341111111 / admin123');
    console.log('   Client Jean: 0341234567 / client123');
    console.log('   Client Marie: 0341234568 / client123');
    console.log('   Client Toky: 0341234569 / client123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetPasswords();