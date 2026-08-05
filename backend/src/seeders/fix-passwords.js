const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  try {
    console.log('🔐 Correction des mots de passe...');

    // Générer des hachages valides
    const passwords = {
      '0340000000': 'admin123',
      '0341111111': 'admin123',
      '0341234567': 'client123',
      '0341234568': 'client123',
      '0341234569': 'client123'
    };

    for (const [phone, password] of Object.entries(passwords)) {
      const hash = await bcrypt.hash(password, 10);
      
      // Mise à jour directe avec SQL
      const query = `
        UPDATE users 
        SET password_hash = '${hash}' 
        WHERE phone = '${phone}'
      `;
      
      await sequelize.query(query);
      console.log(`✅ ${phone} → ${password}`);
    }

    console.log('\n🎉 Correction terminée !');
    console.log('\n📋 Testez avec:');
    console.log('curl -X POST http://localhost:5000/api/auth/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"phone":"0341234567","password":"client123"}\'');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixPasswords();