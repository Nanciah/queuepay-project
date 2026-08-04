const nodemailer = require('nodemailer');

// Configuration du transporteur
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT == 465 ? true : false, // true pour port 465, false pour autres
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Optionnel : ajouter un timeout
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
});

// Vérifier la configuration au démarrage
console.log('📧 Email Service configuré avec :', {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT == 465 ? true : false,
    user: process.env.SMTP_USER ? '✅ Défini' : '❌ Non défini',
    pass: process.env.SMTP_PASS ? '✅ Défini' : '❌ Non défini',
});

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async (email, resetLink, userName) => {
    // Vérifier que les variables sont définies
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ SMTP_USER ou SMTP_PASS non défini dans les variables d\'environnement');
        return false;
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || `"QueuePay" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe QueuePay',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                    .button:hover { background: #4338CA; }
                    .footer { margin-top: 20px; font-size: 12px; color: #6B7280; text-align: center; }
                    .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 QueuePay</h1>
                        <p>Réinitialisation de mot de passe</p>
                    </div>
                    <div class="content">
                        <h2>Bonjour ${userName || 'Utilisateur'},</h2>
                        <p>Nous avons reçu une demande de réinitialisation de votre mot de passe.</p>
                        
                        <div class="warning">
                            <strong>⚠️ Ce lien expire dans 1 heure</strong>
                        </div>
                        
                        <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
                        </div>
                        
                        <p>Ou copiez ce lien dans votre navigateur :</p>
                        <p style="background: #E5E7EB; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
                            ${resetLink}
                        </p>
                        
                        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
                        
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
                        <p style="font-size: 14px; color: #6B7280;">
                            L'équipe QueuePay<br>
                            <a href="${process.env.FRONTEND_URL || 'https://queuepay-frontend.onrender.com'}" style="color: #4F46E5;">
                                ${process.env.FRONTEND_URL || 'QueuePay'}
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} QueuePay. Tous droits réservés.</p>
                        <p>Cet email a été envoyé à ${email}</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email de réinitialisation envoyé à ${email}`);
        console.log(`📨 Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        console.error('📋 Détails:', error);
        
        // Gérer les erreurs courantes
        if (error.code === 'EAUTH') {
            console.error('🔑 Erreur d\'authentification : Vérifiez SMTP_USER et SMTP_PASS');
        } else if (error.code === 'ECONNECTION') {
            console.error('🌐 Erreur de connexion : Vérifiez SMTP_HOST et SMTP_PORT');
        }
        return false;
    }
};

module.exports = { sendPasswordResetEmail };