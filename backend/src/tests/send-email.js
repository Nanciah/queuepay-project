const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// FORCER le chargement du .env depuis le bon chemin
const envPath = path.resolve(__dirname, '../../.env');
console.log(`📂 Chargement du .env depuis: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ Erreur de chargement du .env:', result.error);
    process.exit(1);
}

console.log('✅ .env chargé avec succès !\n');

async function sendTestEmail() {
    console.log('📧 Test d\'envoi d\'email...\n');

    // Vérifier les variables
    console.log('📋 Configuration:');
    console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NON DEFINI'}`);
    console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Défini (' + process.env.SMTP_PASS.slice(0,4) + '****)' : '❌ Non défini'}`);
    console.log(`   EMAIL_ENABLED: ${process.env.EMAIL_ENABLED || 'NON DEFINI'}\n`);

    if (!process.env.SMTP_PASS) {
        console.error('❌ SMTP_PASS non défini dans le .env');
        console.log('💡 Assure-toi que le .env contient:');
        console.log('   SMTP_PASS=cccp xkic tvjl btte');
        return;
    }

    try {
        // Créer le transporteur
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Vérifier la connexion
        console.log('🔍 Vérification de la connexion...');
        await transporter.verify();
        console.log('✅ Connexion SMTP établie !\n');

        // Envoyer un email
        console.log('📤 Envoi de l\'email...');
        const info = await transporter.sendMail({
            from: `QueuePay <${process.env.SMTP_USER}>`,
            to: 'nanciah05@gmail.com',
            subject: '🧪 Test QueuePay - Email fonctionne !',
            text: 'Si vous recevez cet email, la configuration email fonctionne parfaitement ! 🎉',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🧪 Test QueuePay</h1>
                        </div>
                        <div class="content">
                            <p>Si vous recevez cet email, la configuration email fonctionne parfaitement ! 🎉</p>
                            <p>Détails de la configuration :</p>
                            <ul>
                                <li><strong>Email :</strong> ${process.env.SMTP_USER}</li>
                                <li><strong>Serveur :</strong> ${process.env.SMTP_HOST}</li>
                                <li><strong>Port :</strong> ${process.env.SMTP_PORT}</li>
                            </ul>
                            <p>Bonne continuation avec votre projet QueuePay ! 🚀</p>
                        </div>
                        <div class="footer">
                            <p>Cet email a été envoyé automatiquement.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        console.log('✅ Email envoyé avec succès !');
        console.log(`   Message ID: ${info.messageId}`);
        console.log('📧 Vérifie ta boîte mail nanciah05@gmail.com (pense à vérifier les spams)');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('\n💡 Solutions possibles:');
        console.error('   1. Vérifie que le mot de passe d\'application est correct');
        console.error('   2. Vérifie que la validation en deux étapes est activée');
        console.error('   3. Va sur https://myaccount.google.com/apppasswords et recrée un mot de passe');
        console.error('   4. Assure-toi que le .env contient bien:');
        console.error('      SMTP_PASS=cccp xkic tvjl btte');
    }
}

sendTestEmail();