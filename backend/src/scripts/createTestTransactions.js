import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

async function createTestTransactions() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connecté à la base de données');

        const users = await sequelize.query(
            `SELECT id, first_name, last_name, email FROM users 
             WHERE role IN ('company_admin', 'agent', 'client') AND deleted_at IS NULL`,
            { type: sequelize.QueryTypes.SELECT }
        );

        if (users.length === 0) {
            console.log('⚠️ Aucun utilisateur trouvé.');
            process.exit(0);
        }

        const types = ['deposit', 'ticket_purchase', 'refund'];
        const statuses = ['success', 'pending', 'failed'];
        const paymentMethods = ['mvola', 'orange_money', 'wallet'];
        const descriptions = [
            'Dépôt MVola', 'Dépôt Orange Money',
            'Achat ticket - Consultation', 'Achat ticket - Urgence',
            'Remboursement annulation', 'Paiement service'
        ];

        const now = new Date();

        for (let i = 0; i < 20; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            
            let amount = 0;
            if (type === 'deposit') amount = Math.floor(Math.random() * 20000) + 1000;
            else if (type === 'ticket_purchase') amount = Math.floor(Math.random() * 10000) + 2000;
            else amount = Math.floor(Math.random() * 5000) + 500;

            const date = new Date(now);
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            const id = uuidv4();
            const reference = `TXN-${String(i + 1).padStart(6, '0')}`;
            const description = descriptions[Math.floor(Math.random() * descriptions.length)];
            const fee = Math.floor(amount * 0.05);

            await sequelize.query(`
                INSERT INTO transactions 
                (id, user_id, type, amount, fee, payment_method, reference, status, description, created_at, updated_at)
                VALUES (
                    '${id}',
                    '${user.id}',
                    '${type}',
                    ${amount},
                    ${fee},
                    '${paymentMethod}',
                    '${reference}',
                    '${status}',
                    '${description}',
                    '${date.toISOString()}',
                    '${date.toISOString()}'
                )
            `);

            console.log(`✅ Transaction ${i + 1}/20 créée: ${reference}`);
        }

        console.log(`\n✅ 20 transactions de test créées avec succès !`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

createTestTransactions();
