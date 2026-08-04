const { sequelize, User, Entity, Service, Ticket, Transaction } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Créer un Super Admin
    const [admin] = await User.findOrCreate({
      where: { phone: '0340000000' },
      defaults: {
        email: 'admin@queuepay.com',
        phone: '0340000000',
        password_hash: await bcrypt.hash('admin123', 10),
        first_name: 'Admin',
        last_name: 'QueuePay',
        role: 'super_admin',
        is_active: true,
        phone_verified: true,
        email_verified: true,
        wallet_balance: 0
      }
    });
    console.log('✅ Super Admin created');

    // 2. Créer un Admin Métier
    const [businessAdmin] = await User.findOrCreate({
      where: { phone: '0341111111' },
      defaults: {
        email: 'business@banque.mg',
        phone: '0341111111',
        password_hash: await bcrypt.hash('admin123', 10),
        first_name: 'Rajaona',
        last_name: 'Andriana',
        role: 'admin',
        is_active: true,
        phone_verified: true,
        email_verified: true,
        wallet_balance: 0
      }
    });
    console.log('✅ Business Admin created');

    // 3. Créer des Clients
    const clients = await Promise.all([
      User.findOrCreate({
        where: { phone: '0341234567' },
        defaults: {
          email: 'jean.dupont@email.com',
          phone: '0341234567',
          password_hash: await bcrypt.hash('client123', 10),
          first_name: 'Jean',
          last_name: 'Dupont',
          role: 'client',
          is_active: true,
          phone_verified: true,
          email_verified: true,
          wallet_balance: 10000
        }
      }),
      User.findOrCreate({
        where: { phone: '0341234568' },
        defaults: {
          email: 'marie.rasoa@email.com',
          phone: '0341234568',
          password_hash: await bcrypt.hash('client123', 10),
          first_name: 'Marie',
          last_name: 'Rasoa',
          role: 'client',
          is_active: true,
          phone_verified: true,
          email_verified: true,
          wallet_balance: 15000
        }
      }),
      User.findOrCreate({
        where: { phone: '0341234569' },
        defaults: {
          email: 'toky.rabe@email.com',
          phone: '0341234569',
          password_hash: await bcrypt.hash('client123', 10),
          first_name: 'Toky',
          last_name: 'Rabe',
          role: 'client',
          is_active: true,
          phone_verified: true,
          email_verified: true,
          wallet_balance: 5000
        }
      })
    ]);
    console.log('✅ 3 Clients created');

    // 4. Créer une Entité (Banque)
    const [entity] = await Entity.findOrCreate({
      where: { name: 'Banque Nationale Madagascar' },
      defaults: {
        name: 'Banque Nationale Madagascar',
        description: 'Services bancaires pour particuliers et entreprises',
        address: 'Lot IVT 101, Antananarivo 101, Madagascar',
        latitude: -18.8792,
        longitude: 47.5079,
        phone: '0341234000',
        email: 'contact@bnm.mg',
        is_active: true,
        opening_hours: {
          monday: { open: '08:00', close: '17:00' },
          tuesday: { open: '08:00', close: '17:00' },
          wednesday: { open: '08:00', close: '17:00' },
          thursday: { open: '08:00', close: '17:00' },
          friday: { open: '08:00', close: '17:00' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { open: null, close: null }
        }
      }
    });
    console.log('✅ Entity (Banque) created');

    // 5. Créer des Services
    const services = await Promise.all([
      Service.findOrCreate({
        where: { name: 'Ouverture de Compte', entity_id: entity.id },
        defaults: {
          entity_id: entity.id,
          name: 'Ouverture de Compte',
          description: 'Service d\'ouverture de compte bancaire pour particuliers',
          ticket_price: 0,
          max_capacity: 50,
          estimated_duration: 15,
          is_active: true,
          has_priority: false
        }
      }),
      Service.findOrCreate({
        where: { name: 'Retrait d\'Argent', entity_id: entity.id },
        defaults: {
          entity_id: entity.id,
          name: 'Retrait d\'Argent',
          description: 'Retrait d\'argent liquide au guichet',
          ticket_price: 500,
          max_capacity: 30,
          estimated_duration: 5,
          is_active: true,
          has_priority: false
        }
      }),
      Service.findOrCreate({
        where: { name: 'Dépôt d\'Argent', entity_id: entity.id },
        defaults: {
          entity_id: entity.id,
          name: 'Dépôt d\'Argent',
          description: 'Dépôt d\'argent liquide au guichet',
          ticket_price: 500,
          max_capacity: 30,
          estimated_duration: 5,
          is_active: true,
          has_priority: false
        }
      }),
      Service.findOrCreate({
        where: { name: 'Service Prioritaire (Personnes Âgées)', entity_id: entity.id },
        defaults: {
          entity_id: entity.id,
          name: 'Service Prioritaire (Personnes Âgées)',
          description: 'Service prioritaire pour les personnes de plus de 60 ans',
          ticket_price: 0,
          max_capacity: 10,
          estimated_duration: 10,
          is_active: true,
          has_priority: true
        }
      })
    ]);
    console.log('✅ 4 Services created');

    // 6. Créer des Tickets pour les tests
    const [jean, marie, toky] = await Promise.all([
      User.findOne({ where: { phone: '0341234567' } }),
      User.findOne({ where: { phone: '0341234568' } }),
      User.findOne({ where: { phone: '0341234569' } })
    ]);

    const [ouvertureCompte, retrait, depot] = await Promise.all([
      Service.findOne({ where: { name: 'Ouverture de Compte', entity_id: entity.id } }),
      Service.findOne({ where: { name: 'Retrait d\'Argent', entity_id: entity.id } }),
      Service.findOne({ where: { name: 'Dépôt d\'Argent', entity_id: entity.id } })
    ]);

    // Tickets en attente
    await Ticket.findOrCreate({
      where: { ticket_number: `TKT-20260101-0001` },
      defaults: {
        service_id: ouvertureCompte.id,
        user_id: jean.id,
        ticket_number: `TKT-20260101-0001`,
        status: 'waiting',
        position: 1,
        estimated_wait_time: 15,
        payment_status: 'paid',
        qr_code: 'QR-TKT-20260101-0001'
      }
    });

    await Ticket.findOrCreate({
      where: { ticket_number: `TKT-20260101-0002` },
      defaults: {
        service_id: retrait.id,
        user_id: marie.id,
        ticket_number: `TKT-20260101-0002`,
        status: 'waiting',
        position: 2,
        estimated_wait_time: 10,
        payment_status: 'paid',
        qr_code: 'QR-TKT-20260101-0002'
      }
    });

    await Ticket.findOrCreate({
      where: { ticket_number: `TKT-20260101-0003` },
      defaults: {
        service_id: depot.id,
        user_id: toky.id,
        ticket_number: `TKT-20260101-0003`,
        status: 'waiting',
        position: 3,
        estimated_wait_time: 10,
        payment_status: 'pending',
        qr_code: 'QR-TKT-20260101-0003'
      }
    });

    console.log('✅ 3 Tickets created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('📋 Users:');
    console.log('   - Admin: 0340000000 / admin123');
    console.log('   - Business Admin: 0341111111 / admin123');
    console.log('   - Client Jean: 0341234567 / client123');
    console.log('   - Client Marie: 0341234568 / client123');
    console.log('   - Client Toky: 0341234569 / client123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
}

// Exécuter le seed si le fichier est appelé directement
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;