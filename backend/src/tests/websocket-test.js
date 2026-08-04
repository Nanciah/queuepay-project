const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Créer un token de test
const token = jwt.sign(
  { id: 'test-user', role: 'client' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('🔌 Testing WebSocket connection...');

// Créer une connexion WebSocket
const socket = io('http://localhost:5000', {
  auth: { token },
  transports: ['websocket'],
  autoConnect: true
});

// Événements
socket.on('connect', () => {
  console.log('✅ WebSocket connected!');
  console.log(`📡 Socket ID: ${socket.id}`);
  
  // Simuler un client qui suit une file
  console.log('\n📋 Test: Suivre une file');
  socket.emit('join-queue-room', { serviceId: 'test-service-id' });
  
  // Simuler un client qui suit un ticket
  console.log('\n📋 Test: Suivre un ticket');
  socket.emit('track-ticket', { ticketId: 'test-ticket-id' });
  
  // Simuler une demande de position
  console.log('\n📋 Test: Demander la position');
  socket.emit('request-position-update', { ticketId: 'test-ticket-id' });
  
  // Se déconnecter après 3 secondes
  setTimeout(() => {
    console.log('\n🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('queue-status', (data) => {
  console.log('📊 Queue status received:', data);
});

socket.on('ticket-status', (data) => {
  console.log('🎫 Ticket status received:', data);
});

socket.on('position-update', (data) => {
  console.log('📍 Position update received:', data);
});

socket.on('error', (error) => {
  console.log('⚠️ Error:', error);
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected: ${reason}`);
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});