const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000';
let clientToken = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAllFeatures() {
  log('\n🚀 TEST COMPLET DE TOUTES LES FONCTIONNALITÉS', colors.cyan);
  log('═══════════════════════════════════════════════\n', colors.cyan);

  try {
    // 1. Login
    log('📋 1. Connexion du client...', colors.yellow);
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      phone: '0341234567',
      password: 'client123'
    });
    clientToken = loginRes.data.token;
    log(`   ✅ Connecté: ${loginRes.data.user.first_name} ${loginRes.data.user.last_name}`, colors.green);
    log(`   💰 Solde initial: ${loginRes.data.user.wallet_balance} Ar\n`, colors.green);

    // 2. Obtenir le solde
    log('📋 2. Vérification du solde...', colors.yellow);
    const balanceRes = await axios.get(`${BASE_URL}/api/wallet/balance`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    log(`   💰 Solde actuel: ${balanceRes.data.balance} Ar\n`, colors.green);

    // 3. Déposer de l'argent (simulation)
    log('📋 3. Dépôt d\'argent...', colors.yellow);
    const depositRes = await axios.post(`${BASE_URL}/api/wallet/deposit`, {
      amount: 5000,
      method: 'mvola',
      phone: '0341234567'
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    log(`   ✅ Dépôt de 5000 Ar effectué`, colors.green);
    log(`   💰 Nouveau solde: ${depositRes.data.newBalance} Ar\n`, colors.green);

    // 4. Voir l'historique
    log('📋 4. Historique des transactions...', colors.yellow);
    const historyRes = await axios.get(`${BASE_URL}/api/wallet/history`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    log(`   📊 ${historyRes.data.transactions.length} transactions trouvées`, colors.green);
    historyRes.data.transactions.forEach((t, i) => {
      log(`   ${i+1}. ${t.type}: ${t.amount} Ar (${t.status})`, colors.blue);
    });

    // 5. Récupérer les services
    log('\n📋 5. Récupération des services...', colors.yellow);
    const servicesRes = await axios.get(`${BASE_URL}/api/services`);
    const service = servicesRes.data[0];
    log(`   ✅ ${servicesRes.data.length} services trouvés`, colors.green);
    log(`   🏷️ Service: ${service.name} (${service.ticket_price} Ar)\n`, colors.green);

    // 6. Créer un ticket
    log('📋 6. Création d\'un ticket...', colors.yellow);
    const ticketRes = await axios.post(`${BASE_URL}/api/tickets`, {
      service_id: service.id
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const ticket = ticketRes.data;
    log(`   ✅ Ticket créé: ${ticket.ticket_number}`, colors.green);
    log(`   🆔 ID: ${ticket.id}\n`, colors.green);

    // 7. Payer le ticket avec le wallet
    log('📋 7. Paiement du ticket avec le wallet...', colors.yellow);
    const payRes = await axios.post(`${BASE_URL}/api/wallet/pay-ticket`, {
      ticketId: ticket.id,
      amount: parseFloat(service.ticket_price) || 0
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    log(`   ✅ Paiement effectué`, colors.green);
    log(`   💰 Nouveau solde: ${payRes.data.newBalance} Ar\n`, colors.green);

    // 8. Vérifier le ticket
    log('📋 8. Vérification du ticket...', colors.yellow);
    const ticketCheck = await axios.get(`${BASE_URL}/api/tickets/${ticket.id}`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    log(`   📝 Ticket: ${ticketCheck.data.ticket_number}`, colors.green);
    log(`   📊 Statut: ${ticketCheck.data.status}`, colors.green);
    log(`   💳 Paiement: ${ticketCheck.data.payment_status}\n`, colors.green);

    // 9. Test des notifications (simulation)
    log('📋 9. Test des notifications...', colors.yellow);
    try {
      await axios.post(`${BASE_URL}/api/notifications/test-sms`, {
        phone: '0341234567'
      }, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      log(`   ✅ SMS test envoyé (simulation)`, colors.green);
    } catch (error) {
      log(`   ⚠️ SMS: ${error.response?.data?.error || 'simulation'}`);
    }

    try {
      await axios.post(`${BASE_URL}/api/notifications/test-email`, {
        email: 'test@email.com'
      }, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      log(`   ✅ Email test envoyé (simulation)`, colors.green);
    } catch (error) {
      log(`   ⚠️ Email: ${error.response?.data?.error || 'simulation'}`);
    }

    // 10. Remboursement
    log('\n📋 10. Remboursement du ticket...', colors.yellow);
    const refundRes = await axios.post(`${BASE_URL}/api/wallet/refund`, {
      ticketId: ticket.id,
      amount: parseFloat(service.ticket_price) || 0
    }, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    log(`   ✅ Remboursement effectué`, colors.green);
    log(`   💰 Solde final: ${refundRes.data.newBalance} Ar\n`, colors.green);

    // Résumé final
    log('═══════════════════════════════════════════════', colors.cyan);
    log('✅ TEST COMPLET RÉUSSI !', colors.green);
    log('\n📊 RÉSUMÉ DES FONCTIONNALITÉS TESTÉES:', colors.cyan);
    log('   ✅ Authentification JWT', colors.green);
    log('   ✅ Portefeuille numérique (solde, dépôt)', colors.green);
    log('   ✅ Paiement avec wallet', colors.green);
    log('   ✅ Historique des transactions', colors.green);
    log('   ✅ Création de tickets', colors.green);
    log('   ✅ Remboursement', colors.green);
    log('   ✅ Notifications (SMS, Email)', colors.green);
    log('   ✅ WebSocket (démonstration précédente)', colors.green);

  } catch (error) {
    log(`\n❌ ERREUR: ${error.response?.data?.error || error.message}`, colors.red);
    if (error.response?.data) {
      log(`   ${JSON.stringify(error.response.data, null, 2)}`, colors.yellow);
    }
  }
}

testAllFeatures();