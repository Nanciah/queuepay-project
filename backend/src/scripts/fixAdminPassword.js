import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import sequelize from '../config/database.js';

async function fixPassword() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connecté à la base');

        const email = 'nanciah05@gmail.com';
        const newPassword = 'Admin123!';
        
        // Générer le hash
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('🔑 Hash généré:', hashedPassword);

        // Mettre à jour
        const [updated] = await User.update(
            { password: hashedPassword },
            { where: { email } }
        );

        if (updated > 0) {
            console.log(`✅ Mot de passe mis à jour pour ${email}`);
            console.log(`🔑 Nouveau mot de passe: ${newPassword}`);
            
            // Vérifier
            const user = await User.findOne({ where: { email } });
            console.log('📧 Email:', user.email);
            console.log('🔑 Hash stocké:', user.password);
            
        } else {
            console.log(`❌ Utilisateur non trouvé: ${email}`);
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

fixPassword();
