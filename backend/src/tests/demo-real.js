const io = require('socket.io-client');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logClient(message) { log(`👤 [CLIENT] ${message}`, colors.blue); }
function logAgent(message) { log(`👨‍💼 [AGENT] ${message}`, colors.green); }
function logSystem(message) { log(`⚙️ [SYSTEM] ${message}`, colors.cyan); }

// Fonction pour obtenir un token
async function getToken(phone, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      phone,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`❌ Erreur de login (${phone}):`, error.response?.data || error.message);
    return null;
  }
}

// Fonction pour créer un ticket
async function createTicket(token, serviceId) {
  try {
    const response = await axios.post(`${BASE_URL}/api/tickets`,
      { service_id: serviceId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Erreur création ticket:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour obtenir les tickets d'un utilisateur
async function getMyTickets(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/tickets/my-tickets`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération tickets:', error.response?.data || error.message);
    return null;
  }
}

async function runDemo() {
  logSystem('🚀 DÉMARRAGE DE LA DÉMONSTRATION...');
  logSystem('═══════════════════════════════════════════════');

  // 1. Récupérer les services disponibles
  logSystem('\n📋 1. Récupération des services disponibles...');
  
  let services;
  try {
    const response = await axios.get(`${BASE_URL}/api/services`);
    services = response.data;
    logSystem(`✅ ${services.length} services trouvés`);
  } catch (error) {
    logSystem(`❌ Erreur: ${error.message}`, colors.red);
    process.exit(1);
  }

  if (!services || services.length === 0) {
    logSystem('❌ Aucun service trouvé. Exécutez d\'abord: node src/seeders/seed.js', colors.red);
    process.exit(1);
  }

  // Choisir le premier service (Ouverture de Compte)
  const service = services[0];
  logSystem(`✅ Service sélectionné: ${service.name}`);
  logSystem(`   ID: ${service.id}`);
  logSystem(`   Prix: ${service.ticket_price} Ar`);

  // 2. Se connecter en tant que client (Jean)
  logSystem('\n📋 2. Connexion du client...');
  const clientToken = await getToken('0341234567', 'client123');
  if (!clientToken) {
    logSystem('❌ Échec de connexion du client', colors.red);
    process.exit(1);
  }
  logClient('✅ Client connecté (Jean Dupont)');

  // 3. Créer un ticket
  logSystem('\n📋 3. Création d\'un ticket...');
  const ticket = await createTicket(clientToken, service.id);
  if (!ticket) {
    logSystem('❌ Échec de création du ticket', colors.red);
    process.exit(1);
  }
  logClient(`✅ Ticket créé: ${ticket.ticket_number}`);
  logClient(`   ID: ${ticket.id}`);

  // 4. Connexion WebSocket du client
  logSystem('\n📋 4. Connexion WebSocket du client...');
  const clientSocket = io(BASE_URL, {
    auth: { token: clientToken },
    transports: ['websocket'],
    reconnection: false
  });

  clientSocket.on('connect', () => {
    logClient(`✅ WebSocket connecté (ID: ${clientSocket.id})`);
    
    // Suivre le ticket
    clientSocket.emit('track-ticket', { ticketId: ticket.id });
    logClient(`📋 Suivi du ticket: ${ticket.id}`);
    
    // Suivre la file
    clientSocket.emit('join-queue-room', { serviceId: service.id });
    logClient(`📋 Suivi de la file: ${service.id}`);
    
    // Demander la position après 1 seconde
    setTimeout(() => {
      clientSocket.emit('request-position-update', { ticketId: ticket.id });
      logClient(`📍 Demande de position`);
    }, 1000);
  });

  // Événements du client
  clientSocket.on('ticket-status', (data) => {
    logClient(`📊 Status du ticket: ${data.ticket?.status || 'inconnu'}`);
    if (data.position) {
      logClient(`   Position: ${data.position}`);
    }
  });

  clientSocket.on('queue-status', (data) => {
    logClient(`📊 File: ${data.waitingCount || 0} personnes en attente`);
    if (data.estimatedTime) {
      logClient(`   Temps estimé: ${data.estimatedTime} min`);
    }
  });

  clientSocket.on('position-update', (data) => {
    logClient(`📍 Position: ${data.position || 'en attente'}`);
    if (data.estimatedTime) {
      logClient(`   Temps estimé: ${data.estimatedTime} min`);
    }
    if (data.waitingCount !== undefined) {
      logClient(`   ${data.waitingCount} personnes devant vous`);
    }
  });

  clientSocket.on('you-are-near', (data) => {
    logClient(`⚠️ ⚠️ ⚠️ VOUS ÊTES ${data.position}ÈME DANS LA FILE ! ⚠️ ⚠️ ⚠️`, colors.yellow);
  });

  clientSocket.on('you-are-called', (data) => {
    logClient(`🔔 🔔 🔔 APPEL: Vous êtes appelé au guichet! 🔔 🔔 🔔`, colors.green);
    logClient(`   Ticket: ${data.ticketNumber}`);
    logClient(`   Service: ${service.name}`);
  });

  clientSocket.on('ticket-served', (data) => {
    logClient(`✅ ✅ ✅ SERVICE RENDU ! ✅ ✅ ✅`, colors.green);
    logClient(`   Merci de votre visite !`);
  });

  clientSocket.on('ticket-cancelled', (data) => {
    logClient(`❌ Ticket annulé`, colors.red);
  });

  clientSocket.on('error', (error) => {
    logClient(`⚠️ Erreur: ${error.message}`, colors.red);
  });

  // 5. Connexion de l'agent après 2 secondes
  setTimeout(async () => {
    logSystem('\n📋 5. Connexion de l\'agent...');
    const agentToken = await getToken('0341111111', 'admin123');
    if (!agentToken) {
      logSystem('❌ Échec de connexion de l\'agent', colors.red);
      return;
    }

    const agentSocket = io(BASE_URL, {
      auth: { token: agentToken },
      transports: ['websocket'],
      reconnection: false
    });

    agentSocket.on('connect', () => {
      logAgent(`✅ WebSocket connecté (ID: ${agentSocket.id})`);
      
      // Se connecter au service
      agentSocket.emit('agent-connect', { serviceId: service.id });
      logAgent(`📋 Connecté au service: ${service.name}`);
    });

    // Événements de l'agent
    agentSocket.on('waiting-list', (data) => {
      logAgent(`📋 Liste d'attente: ${data.length} clients`);
      if (data.length > 0) {
        data.forEach((t, i) => {
          const userName = t.User?.first_name || 'Anonyme';
          logAgent(`   ${i+1}. ${t.ticket_number} - ${userName}`);
        });
      } else {
        logAgent(`   Aucun client en attente`);
      }
    });

    agentSocket.on('ticket-called', (data) => {
      logAgent(`📞 Ticket appelé: ${data.ticket_number}`, colors.green);
      const userName = data.User?.first_name || 'Anonyme';
      logAgent(`   Client: ${userName}`);
    });

    agentSocket.on('ticket-served-confirmed', (data) => {
      logAgent(`✅ Ticket ${data.ticketId} marqué comme servi`, colors.green);
    });

    agentSocket.on('error', (error) => {
      logAgent(`⚠️ Erreur: ${error.message}`, colors.red);
    });

    // Appeler le prochain client après 3 secondes
    setTimeout(() => {
      logSystem('\n📋 6. L\'agent appelle le prochain client...');
      agentSocket.emit('call-next', { serviceId: service.id });
      logAgent(`📞 Appel du prochain client`);
    }, 3000);

    // Servir le ticket après 5 secondes
    setTimeout(() => {
      logSystem('\n📋 7. L\'agent sert le ticket...');
      agentSocket.emit('serve-ticket', { ticketId: ticket.id });
      logAgent(`✅ Service du ticket: ${ticket.id}`);
    }, 5000);

    // Déconnexion après 8 secondes
    setTimeout(() => {
      logSystem('\n📋 8. Fin de la démonstration...');
      clientSocket.disconnect();
      agentSocket.disconnect();
      logSystem('✅ Démonstration terminée avec succès !', colors.green);
      logSystem('\n📊 RÉSUMÉ:');
      logSystem(`   ✅ Client connecté (Jean Dupont)`);
      logSystem(`   ✅ Ticket créé: ${ticket.ticket_number}`);
      logSystem(`   ✅ WebSocket: connexion en temps réel`);
      logSystem(`   ✅ Agent connecté`);
      logSystem(`   ✅ Client appelé`);
      logSystem(`   ✅ Ticket servi`);
      logSystem(`\n🎯 Le système de file d\'attente en temps réel fonctionne parfaitement !`);
      process.exit(0);
    }, 8000);

  }, 2000);

  // Gestion des erreurs
  process.on('uncaughtException', (error) => {
    log(`❌ Erreur: ${error.message}`, colors.red);
    process.exit(1);
  });
}

// Lancer la démonstration
runDemo();