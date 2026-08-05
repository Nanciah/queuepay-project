const io = require('socket.io-client');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Configuration
const BASE_URL = 'http://localhost:5000';
let clientSocket = null;
let agentSocket = null;
let adminSocket = null;

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
function logAdmin(message) { log(`👑 [ADMIN] ${message}`, colors.magenta); }
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
    log(`❌ Erreur de login: ${error.message}`, colors.red);
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
    log(`❌ Erreur création ticket: ${error.message}`, colors.red);
    return null;
  }
}

// Fonction pour obtenir les services
async function getServices() {
  try {
    const response = await axios.get(`${BASE_URL}/api/services`);
    return response.data;
  } catch (error) {
    log(`❌ Erreur récupération services: ${error.message}`, colors.red);
    return null;
  }
}

async function runDemo() {
  logSystem('🚀 DÉMARRAGE DE LA DÉMONSTRATION...');
  logSystem('═══════════════════════════════════════════════');

  // 1. Récupérer les services
  logSystem('\n📋 1. Récupération des services disponibles...');
  const services = await getServices();
  if (!services || services.length === 0) {
    log('❌ Aucun service trouvé. Assurez-vous que les seeds sont chargés.', colors.red);
    process.exit(1);
  }
  
  const service = services[0];
  logSystem(`✅ Service trouvé: ${service.name} (ID: ${service.id})`);

  // 2. Se connecter en tant que client
  logSystem('\n📋 2. Connexion du client...');
  const clientToken = await getToken('0341234567', 'client123');
  if (!clientToken) process.exit(1);
  logClient(`✅ Connecté avec le token: ${clientToken.substring(0, 20)}...`);

  // 3. Créer un ticket
  logSystem('\n📋 3. Création d\'un ticket...');
  const ticket = await createTicket(clientToken, service.id);
  if (!ticket) process.exit(1);
  logClient(`✅ Ticket créé: ${ticket.ticket_number} (ID: ${ticket.id})`);

  // 4. Connexion WebSocket du client
  logSystem('\n📋 4. Connexion WebSocket du client...');
  clientSocket = io(BASE_URL, {
    auth: { token: clientToken },
    transports: ['websocket']
  });

  clientSocket.on('connect', () => {
    logClient(`✅ WebSocket connecté (ID: ${clientSocket.id})`);
    
    // Suivre le ticket
    clientSocket.emit('track-ticket', { ticketId: ticket.id });
    logClient(`📋 Suivi du ticket: ${ticket.id}`);
    
    // Suivre la file
    clientSocket.emit('join-queue-room', { serviceId: service.id });
    logClient(`📋 Suivi de la file: ${service.id}`);
    
    // Demander la position
    setTimeout(() => {
      clientSocket.emit('request-position-update', { ticketId: ticket.id });
      logClient(`📍 Demande de position`);
    }, 1000);
  });

  // Écouter les événements du client
  clientSocket.on('ticket-status', (data) => {
    logClient(`📊 Status reçu: Position ${data.position || 'en attente'}`);
  });

  clientSocket.on('queue-status', (data) => {
    logClient(`📊 File: ${data.waitingCount} personnes en attente`);
  });

  clientSocket.on('position-update', (data) => {
    logClient(`📍 Position: ${data.position || 'en attente'}, Temps estimé: ${data.estimatedTime || '?'} min`);
  });

  clientSocket.on('you-are-near', (data) => {
    logClient(`⚠️ VOUS ÊTES ${data.position}ÈME DANS LA FILE !`, colors.yellow);
  });

  clientSocket.on('you-are-called', (data) => {
    logClient(`🔔 APPEL: Vous êtes appelé au guichet! Ticket: ${data.ticketNumber}`, colors.green);
  });

  clientSocket.on('ticket-served', (data) => {
    logClient(`✅ Service rendu! Merci de votre visite.`, colors.green);
  });

  clientSocket.on('error', (error) => {
    logClient(`⚠️ Erreur: ${error.message}`, colors.red);
  });

  // 5. Connexion de l'agent après 2 secondes
  setTimeout(async () => {
    logSystem('\n📋 5. Connexion de l\'agent...');
    const agentToken = await getToken('0341111111', 'admin123');
    if (!agentToken) return;

    agentSocket = io(BASE_URL, {
      auth: { token: agentToken },
      transports: ['websocket']
    });

    agentSocket.on('connect', () => {
      logAgent(`✅ WebSocket connecté (ID: ${agentSocket.id})`);
      
      // Se connecter au service
      agentSocket.emit('agent-connect', { serviceId: service.id });
      logAgent(`📋 Connecté au service: ${service.id}`);
    });

    agentSocket.on('waiting-list', (data) => {
      logAgent(`📋 Liste d'attente: ${data.length} clients`);
      data.forEach((t, i) => {
        logAgent(`   ${i+1}. ${t.ticket_number} - ${t.User?.first_name || 'Anonyme'}`);
      });
    });

    agentSocket.on('ticket-called', (data) => {
      logAgent(`📞 Ticket appelé: ${data.ticket_number}`, colors.green);
    });

    agentSocket.on('ticket-served-confirmed', (data) => {
      logAgent(`✅ Ticket ${data.ticketId} marqué comme servi`, colors.green);
    });

    agentSocket.on('error', (error) => {
      logAgent(`⚠️ Erreur: ${error.message}`, colors.red);
    });

    // Appeler le prochain client après 3 secondes
    setTimeout(() => {
      logSystem('\n📋 6. Appel du prochain client...');
      agentSocket.emit('call-next', { serviceId: service.id });
      logAgent(`📞 Appel du prochain client`);
    }, 3000);

    // Servir le ticket après 2 secondes
    setTimeout(() => {
      logSystem('\n📋 7. Service du ticket...');
      // Récupérer le ticket appelé
      axios.get(`${BASE_URL}/api/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${agentToken}` }
      }).then(res => {
        if (res.data.status === 'called') {
          agentSocket.emit('serve-ticket', { ticketId: ticket.id });
          logAgent(`✅ Service du ticket: ${ticket.id}`);
        }
      }).catch(err => {
        logAgent(`⚠️ Ticket non trouvé ou déjà servi`, colors.yellow);
      });
    }, 5000);

    // Déconnexion après 8 secondes
    setTimeout(() => {
      logSystem('\n📋 8. Fin de la démonstration...');
      if (clientSocket) clientSocket.disconnect();
      if (agentSocket) agentSocket.disconnect();
      logSystem('✅ Démonstration terminée!');
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