import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import sequelize from '../config/database.js';

async function createSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Vérifier si un Super Admin existe déjà
    const existingAdmin = await User.findOne({
      where: { email: 'admin@queuepay.mg' }
    });

    if (existingAdmin) {
      console.log('✅ Super Admin existe déjà:');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Nom:', existingAdmin.first_name, existingAdmin.last_name);
      console.log('🔑 Rôle:', existingAdmin.role);
      process.exit(0);
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('Admin@2026#QueuePay', 10);
    
    // Créer le Super Admin
    const superAdmin = await User.create({
      id: uuidv4(),
      email: 'admin@queuepay.mg',
      phone: '0341234567',
      password: hashedPassword,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
      status: 'active',
      phone_verified: true,
      email_verified: true,
      language: 'fr'
    });

    console.log('✅ Super Admin créé avec succès!');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 Mot de passe: Admin@2026#QueuePay');
    console.log('🆔 ID:', superAdmin.id);
    console.log('👤 Rôle:', superAdmin.role);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createSuperAdmin();
