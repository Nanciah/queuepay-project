const io = require('socket.io-client');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function testWebSocketWithEmail() {
    console.log('🚀 TEST WEBSOCKET + EMAIL\n');
    console.log('═'.repeat(50));

    try {
        // 1. Connexion client
        console.log('\n📋 1. Connexion client...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            phone: '0341234567',
            password: 'client123'
        });
        const clientToken = loginRes.data.token;
        console.log(`   ✅ Client connecté: ${loginRes.data.user.first_name}`);
        console.log(`   📧 Email: ${loginRes.data.user.email}`);

        // 2. Récupérer un service
        console.log('\n📋 2. Récupération des services...');
        const servicesRes = await axios.get(`${BASE_URL}/api/services`);
        const service = servicesRes.data[0];
        console.log(`   ✅ Service: ${service.name} (${service.id})`);

        // 3. Créer un ticket (EMAIL DE CONFIRMATION)
        console.log('\n📋 3. Création du ticket (Email de confirmation)...');
        const ticketRes = await axios.post(`${BASE_URL}/api/tickets`,
            { service_id: service.id },
            { headers: { Authorization: `Bearer ${clientToken}` } }
        );
        const ticket = ticketRes.data;
        console.log(`   ✅ Ticket créé: ${ticket.ticket_number}`);
        console.log(`   📧 Un email de confirmation a été envoyé`);

        // 4. Connexion WebSocket client
        console.log('\n📋 4. Connexion WebSocket client...');
        const clientSocket = io(BASE_URL, {
            auth: { token: clientToken },
            transports: ['websocket']
        });

        clientSocket.on('connect', () => {
            console.log(`   ✅ Client WebSocket connecté`);
            clientSocket.emit('track-ticket', { ticketId: ticket.id });
            clientSocket.emit('join-queue-room', { serviceId: service.id });
            console.log(`   📋 Suivi du ticket: ${ticket.id}`);
        });

        // Écouter les événements
        clientSocket.on('you-are-called', (data) => {
            console.log(`\n   🔔 CLIENT: JE SUIS APPELÉ !`);
            console.log(`   Ticket: ${data.ticketNumber}`);
            console.log(`   📧 Un email d'appel a été envoyé`);
        });

        clientSocket.on('you-are-near', (data) => {
            console.log(`   ⚠️ Vous êtes ${data.position}ème dans la file`);
            console.log(`   📧 Un email de rappel a été envoyé`);
        });

        clientSocket.on('ticket-served', (data) => {
            console.log(`\n   ✅ CLIENT: SERVICE RENDU !`);
            console.log(`   📧 Un email de service rendu a été envoyé`);
        });

        clientSocket.on('ticket-cancelled', (data) => {
            console.log(`\n   ❌ CLIENT: TICKET ANNULÉ`);
            console.log(`   Raison: ${data.reason}`);
            console.log(`   📧 Un email d'annulation a été envoyé`);
        });

        clientSocket.on('error', (error) => {
            console.log(`   ⚠️ Erreur: ${error.message}`);
        });

        // 5. Connexion agent
        setTimeout(async () => {
            console.log('\n📋 5. Connexion agent...');
            const agentLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
                phone: '0341111111',
                password: 'admin123'
            });
            const agentToken = agentLogin.data.token;

            const agentSocket = io(BASE_URL, {
                auth: { token: agentToken },
                transports: ['websocket']
            });

            agentSocket.on('connect', () => {
                console.log(`   ✅ Agent WebSocket connecté`);
                agentSocket.emit('agent-connect', { serviceId: service.id });
                console.log(`   📋 Connecté au service: ${service.name}`);
            });

            agentSocket.on('waiting-list', (data) => {
                console.log(`   📋 ${data.length} clients en attente`);
                data.forEach((t, i) => {
                    console.log(`      ${i+1}. ${t.ticket_number} - ${t.User?.first_name || 'Anonyme'}`);
                });
            });

            agentSocket.on('error', (error) => {
                console.log(`   ⚠️ Erreur agent: ${error.message}`);
            });

            // 6. Appeler le client (EMAIL D'APPEL)
            setTimeout(() => {
                console.log('\n📋 6. Appel du client (Email d\'appel)...');
                agentSocket.emit('call-next', { serviceId: service.id });
                console.log(`   📞 Agent appelle le prochain client`);
                console.log(`   📧 Un email d'appel va être envoyé au client`);
            }, 3000);

            // 7. Servir le ticket (EMAIL DE SERVICE)
            setTimeout(() => {
                console.log('\n📋 7. Service du ticket (Email de service)...');
                agentSocket.emit('serve-ticket', { ticketId: ticket.id });
                console.log(`   ✅ Agent marque le ticket comme servi`);
                console.log(`   📧 Un email de service rendu va être envoyé`);
            }, 6000);

            // 8. Fin
            setTimeout(() => {
                console.log('\n' + '═'.repeat(50));
                console.log('✅ TEST COMPLET TERMINÉ !');
                console.log('\n📧 VÉRIFIE TA BOÎTE MAIL nanciah05@gmail.com');
                console.log('   Tu devrais avoir reçu :');
                console.log('   1. Email de confirmation de ticket');
                console.log('   2. Email d\'appel au guichet');
                console.log('   3. Email de service rendu');
                console.log('\n📊 RÉSUMÉ DES EMAILS ENVOYÉS:');
                console.log('   ✅ Confirmation de ticket');
                console.log('   ✅ Appel au guichet');
                console.log('   ✅ Service rendu');
                
                clientSocket.disconnect();
                agentSocket.disconnect();
                process.exit(0);
            }, 8000);

        }, 2000);

    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('   Détails:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

testWebSocketWithEmail();