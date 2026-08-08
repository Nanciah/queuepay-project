import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
    constructor() {
        this.resend = null;
        this.isSimulated = false;
        this.initResend();
    }

    initResend() {
        if (process.env.RESEND_API_KEY) {
            try {
                this.resend = new Resend(process.env.RESEND_API_KEY);
                console.log('✅ EmailService: Resend configuré');
            } catch (error) {
                console.log('⚠️ EmailService: Erreur configuration Resend, mode simulation');
                this.isSimulated = true;
            }
        } else {
            console.log('⚠️ EmailService: Aucune clé API Resend, mode simulation');
            this.isSimulated = true;
        }
    }

    async sendEmail(to, subject, html) {
        if (this.isSimulated) {
            console.log(`📧 [SIMULATION] Email envoyé à ${to}`);
            console.log(`   Sujet: ${subject}`);
            console.log(`   Contenu: ${html.substring(0, 200)}...`);
            return {
                success: true,
                simulated: true,
                messageId: `sim-${Date.now()}`
            };
        }

        try {
            const { data, error } = await this.resend.emails.send({
                from: process.env.SMTP_FROM || 'QueuePay <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html,
            });

            if (error) {
                console.error('❌ Erreur Resend:', error);
                return { success: false, error: error.message };
            }

            console.log(`✅ Email envoyé à ${to}: ${data?.id}`);
            return {
                success: true,
                messageId: data?.id,
                simulated: false
            };
        } catch (error) {
            console.error(`❌ Erreur envoi email à ${to}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========== EMAIL DE BIENVENUE CLIENT ==========
    async sendWelcomeEmail(email, firstName, lastName) {
        const subject = '🎉 Bienvenue sur QueuePay !';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .features { list-style: none; padding: 0; }
                    .features li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
                    .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                    .highlight { color: #4F46E5; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Bienvenue sur QueuePay</h1>
                        <p>La plateforme de gestion de file d'attente</p>
                    </div>
                    <div class="content">
                        <h2>Bonjour <span class="highlight">${firstName} ${lastName}</span>,</h2>
                        <p>Votre compte a été créé avec succès sur la plateforme QueuePay.</p>
                        <p>Vous pouvez dès maintenant :</p>
                        <ul class="features">
                            <li>✅ Réserver des tickets en ligne</li>
                            <li>✅ Suivre votre position en temps réel</li>
                            <li>✅ Payer via MVola ou Orange Money</li>
                            <li>✅ Gérer votre portefeuille numérique</li>
                        </ul>
                        <p style="text-align: center;">
                            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" class="button">
                                🔗 Accéder à mon compte
                            </a>
                        </p>
                        <p>L'équipe QueuePay</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} QueuePay - Tous droits réservés</p>
                        <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }

    // ========== EMAIL TICKET CRÉÉ ==========
    async sendTicketConfirmation(email, ticketNumber, serviceName, position, estimatedTime) {
        const subject = `🎫 Votre ticket ${ticketNumber} - QueuePay`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .ticket-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎫 Ticket créé</h1>
                    </div>
                    <div class="content">
                        <p>Votre ticket a été créé avec succès !</p>
                        <div class="ticket-info">
                            <p><strong>Numéro :</strong> ${ticketNumber}</p>
                            <p><strong>Service :</strong> ${serviceName}</p>
                            <p><strong>Position :</strong> ${position}ème</p>
                            <p><strong>Temps d'attente estimé :</strong> ${estimatedTime} minutes</p>
                        </div>
                        <p>Vous serez notifié lorsque votre tour approchera.</p>
                        <p>L'équipe QueuePay</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 QueuePay - Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }

    // ========== EMAIL TICKET APPELÉ ==========
    async sendTicketCalled(email, ticketNumber, serviceName) {
        const subject = `🔔 Votre ticket ${ticketNumber} est appelé ! - QueuePay`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .ticket-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔔 C'est votre tour !</h1>
                    </div>
                    <div class="content">
                        <p>Votre ticket est appelé au guichet !</p>
                        <div class="ticket-info">
                            <p><strong>Numéro :</strong> ${ticketNumber}</p>
                            <p><strong>Service :</strong> ${serviceName}</p>
                        </div>
                        <p>Veuillez vous présenter au guichet.</p>
                        <p>L'équipe QueuePay</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 QueuePay - Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }

    // ========== EMAIL CONFIRMATION PAIEMENT ==========
    async sendPaymentConfirmation(email, amount, type, reference) {
        const subject = `💳 Confirmation de paiement - QueuePay`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .payment-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💳 Paiement confirmé</h1>
                    </div>
                    <div class="content">
                        <p>Votre paiement a été confirmé avec succès.</p>
                        <div class="payment-info">
                            <p><strong>Montant :</strong> ${amount} Ar</p>
                            <p><strong>Type :</strong> ${type}</p>
                            <p><strong>Référence :</strong> ${reference}</p>
                        </div>
                        <p>Merci d'utiliser QueuePay !</p>
                        <p>L'équipe QueuePay</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 QueuePay - Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }

    // ========== EMAIL IDENTIFIANTS ADMIN ==========
    async sendCredentialsEmail(email, password, companyName, adminName) {
        const subject = `🎉 Bienvenue sur QueuePay - Vos identifiants pour ${companyName}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .credentials { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .credential-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
                    .credential-item:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #4F46E5; font-weight: bold; }
                    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Bienvenue sur QueuePay</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>${adminName}</strong>,</p>
                        <p>Votre entreprise <strong>${companyName}</strong> a été créée avec succès.</p>
                        <p>Voici vos identifiants de connexion :</p>
                        <div class="credentials">
                            <div class="credential-item">
                                <span class="label">📧 Email</span>
                                <span class="value">${email}</span>
                            </div>
                            <div class="credential-item">
                                <span class="label">🔑 Mot de passe</span>
                                <span class="value">${password}</span>
                            </div>
                            <div class="credential-item">
                                <span class="label">🏢 Entreprise</span>
                                <span class="value">${companyName}</span>
                            </div>
                        </div>
                        <p><strong>⚠️ Important :</strong> Nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                                🔗 Se connecter
                            </a>
                        </p>
                        <p>L'équipe QueuePay</p>
                    </div>
                    <div class="footer">
                        <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                        <p>&copy; 2026 QueuePay - Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }

    // ========== EMAIL IDENTIFIANTS AGENT ==========
    async sendAgentCredentialsEmail(email, password, companyName, agentName) {
        const subject = `🎫 Vos identifiants agent - QueuePay - ${companyName}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                    .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .credentials { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .credential-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
                    .credential-item:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #555; }
                    .value { color: #10B981; font-weight: bold; }
                    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                    .button { display: inline-block; background: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎫 Vos identifiants agent</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>${agentName}</strong>,</p>
                        <p>Vous avez été enregistré comme <strong>agent</strong> pour l'entreprise <strong>${companyName}</strong>.</p>
                        <p>Voici vos identifiants de connexion :</p>
                        <div class="credentials">
                            <div class="credential-item">
                                <span class="label">📧 Email</span>
                                <span class="value">${email}</span>
                            </div>
                            <div class="credential-item">
                                <span class="label">🔑 Mot de passe</span>
                                <span class="value">${password}</span>
                            </div>
                            <div class="credential-item">
                                <span class="label">🏢 Entreprise</span>
                                <span class="value">${companyName}</span>
                            </div>
                            <div class="credential-item">
                                <span class="label">🎯 Rôle</span>
                                <span class="value">Agent de guichet</span>
                            </div>
                        </div>
                        <p><strong>⚠️ Important :</strong> Changez votre mot de passe lors de votre première connexion.</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" class="button">
                                🔗 Se connecter
                            </a>
                        </p>
                        <p>L'équipe QueuePay</p>
                    </div>
                    <div class="footer">
                        <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                        <p>&copy; 2026 QueuePay - Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }

    // ========== EMAIL SERVICE RENDU ==========
    async sendTicketCompleted(email, ticketNumber, serviceName) {
        const subject = `✅ QueuePay - Service rendu pour le ticket ${ticketNumber}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 3px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #10B981; font-size: 28px; margin: 0; }
                    .ticket-number { font-size: 48px; font-weight: bold; color: #10B981; text-align: center; padding: 20px; background: #ECFDF5; border-radius: 12px; margin: 20px 0; }
                    .info { background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
                    .info-item:last-child { border-bottom: none; }
                    .label { color: #6B7280; }
                    .value { font-weight: 500; color: #1F2937; }
                    .success-box { background: #ECFDF5; border-left: 4px solid #10B981; padding: 16px; border-radius: 8px; margin: 20px 0; }
                    .success-box p { margin: 0; color: #065F46; }
                    .footer { text-align: center; padding-top: 20px; color: #9CA3AF; font-size: 14px; border-top: 1px solid #E5E7EB; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Service rendu !</h1>
                    </div>
                    <div class="success-box">
                        <p><strong>✅ Votre service a été rendu avec succès !</strong></p>
                    </div>
                    <div class="ticket-number">${ticketNumber}</div>
                    <div class="info">
                        <div class="info-item">
                            <span class="label">Service</span>
                            <span class="value">${serviceName}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Statut</span>
                            <span class="value" style="color: #10B981;">✅ Complété</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Date</span>
                            <span class="value">${new Date().toLocaleString('fr-FR')}</span>
                        </div>
                    </div>
                    <p style="text-align: center; color: #6B7280; margin-top: 20px;">
                        Merci d'avoir utilisé QueuePay. Nous espérons vous revoir bientôt !
                    </p>
                    <div class="footer">
                        <p>© 2026 QueuePay - Votre solution de file d'attente intelligente</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }

    // ========== EMAIL ANNULATION ==========
    async sendTicketCancelled(email, ticketNumber, serviceName, reason) {
        const subject = `❌ QueuePay - Ticket ${ticketNumber} annulé`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 3px solid #EF4444; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #EF4444; font-size: 28px; margin: 0; }
                    .ticket-number { font-size: 48px; font-weight: bold; color: #EF4444; text-align: center; padding: 20px; background: #FEF2F2; border-radius: 12px; margin: 20px 0; }
                    .info { background: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
                    .info-item:last-child { border-bottom: none; }
                    .label { color: #6B7280; }
                    .value { font-weight: 500; color: #1F2937; }
                    .alert-box { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; border-radius: 8px; margin: 20px 0; }
                    .alert-box p { margin: 0; color: #991B1B; }
                    .footer { text-align: center; padding-top: 20px; color: #9CA3AF; font-size: 14px; border-top: 1px solid #E5E7EB; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Ticket annulé</h1>
                    </div>
                    <div class="alert-box">
                        <p><strong>❌ Votre ticket a été annulé.</strong></p>
                        ${reason ? `<p>Raison : ${reason}</p>` : ''}
                    </div>
                    <div class="ticket-number">${ticketNumber}</div>
                    <div class="info">
                        <div class="info-item">
                            <span class="label">Service</span>
                            <span class="value">${serviceName}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Statut</span>
                            <span class="value" style="color: #EF4444;">❌ Annulé</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Date</span>
                            <span class="value">${new Date().toLocaleString('fr-FR')}</span>
                        </div>
                    </div>
                    <p style="text-align: center; color: #6B7280; margin-top: 20px;">
                        Si vous avez des questions, veuillez contacter le service client.
                    </p>
                    <div class="footer">
                        <p>© 2026 QueuePay - Votre solution de file d'attente intelligente</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }

    // ========== NOUVEAU MOT DE PASSE GÉNÉRÉ ==========
    async sendNewPasswordEmail(email, newPassword, userName) {
        const subject = '🔑 Votre nouveau mot de passe QueuePay';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { padding: 20px; }
                    .password-box { 
                        background: #f5f5f5; 
                        padding: 20px; 
                        border-radius: 8px; 
                        margin: 20px 0;
                        text-align: center;
                        border: 2px dashed #4F46E5;
                    }
                    .password { 
                        font-size: 24px; 
                        font-weight: bold; 
                        color: #4F46E5;
                        letter-spacing: 2px;
                        word-break: break-all;
                    }
                    .warning { 
                        background: #FEF3C7; 
                        border-left: 4px solid #F59E0B; 
                        padding: 12px; 
                        margin: 15px 0; 
                    }
                    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                    .button { 
                        display: inline-block; 
                        padding: 12px 30px; 
                        background: #4F46E5; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        margin: 20px 0; 
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔑 QueuePay</h1>
                        <p>Réinitialisation de votre mot de passe</p>
                    </div>
                    <div class="content">
                        <h2>Bonjour ${userName},</h2>
                        <p>Suite à votre demande de réinitialisation, voici votre nouveau mot de passe :</p>
                        <div class="password-box">
                            <p style="margin: 0 0 10px 0; color: #666;">Votre nouveau mot de passe :</p>
                            <div class="password">${newPassword}</div>
                        </div>
                        <div class="warning">
                            <strong>⚠️ Important :</strong> 
                            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                                <li>Connectez-vous avec ce nouveau mot de passe</li>
                                <li>Changez-le dès votre prochaine connexion</li>
                                <li>Ce mot de passe est valable jusqu'à ce que vous le changiez</li>
                            </ul>
                        </div>
                        <p style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                                🔗 Se connecter
                            </a>
                        </p>
                        <p>Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement notre support.</p>
                        <p style="font-size: 14px; color: #6B7280;">L'équipe QueuePay</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} QueuePay - Tous droits réservés</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(email, subject, html);
    }
}

export default new EmailService();
