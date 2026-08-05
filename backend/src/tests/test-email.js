import EmailService from '../services/EmailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env depuis la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testEmail() {
    console.log('📧 Test d\'envoi d\'email avec Gmail...\n');

    const testEmail = 'nanciah05@gmail.com';

    try {
        console.log('📋 1. Test de confirmation de ticket...');
        const result1 = await EmailService.sendTicketConfirmation(
            testEmail,
            'TKT-TEST-001',
            'Ouverture de Compte',
            '1ère',
            '5'
        );
        console.log(`   ✅ Résultat: ${result1.success ? 'OK' : 'ÉCHEC'}`);
        if (result1.simulated) {
            console.log('   📝 Mode simulation activé');
        } else {
            console.log(`   📨 Message ID: ${result1.messageId}`);
        }

        console.log('\n📋 2. Test d\'appel au guichet...');
        const result2 = await EmailService.sendTicketCalled(
            testEmail,
            'TKT-TEST-001',
            'Ouverture de Compte'
        );
        console.log(`   ✅ Résultat: ${result2.success ? 'OK' : 'ÉCHEC'}`);

        console.log('\n📋 3. Test de confirmation de paiement...');
        const result3 = await EmailService.sendPaymentConfirmation(
            testEmail,
            '5000',
            'Dépôt',
            'TXN-123456'
        );
        console.log(`   ✅ Résultat: ${result3.success ? 'OK' : 'ÉCHEC'}`);

        console.log('\n📋 4. Test d\'envoi des identifiants...');
        const result4 = await EmailService.sendCredentialsEmail(
            testEmail,
            'MonMotDePasse123!',
            'Ma Société Test',
            'Jean Dupont'
        );
        console.log(`   ✅ Résultat: ${result4.success ? 'OK' : 'ÉCHEC'}`);

        console.log('\n✅ Tous les tests sont terminés !');
        console.log('📧 Vérifie ta boîte mail (et les spams) !');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error(error);
    }
}

testEmail();