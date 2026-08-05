import sequelize from '../config/database.js';
import Holiday from '../models/Holiday.js';

const holidays = [
    { date: '2026-01-01', name: 'Nouvel An', is_recurring: true },
    { date: '2026-03-29', name: 'Lundi de Pâques', is_recurring: false },
    { date: '2026-04-01', name: 'Journée de la Jeunesse', is_recurring: true },
    { date: '2026-05-01', name: 'Fête du Travail', is_recurring: true },
    { date: '2026-05-25', name: 'Ascension', is_recurring: false },
    { date: '2026-06-04', name: 'Pentecôte', is_recurring: false },
    { date: '2026-06-26', name: 'Fête de l\'Indépendance', is_recurring: true },
    { date: '2026-08-15', name: 'Assomption', is_recurring: true },
    { date: '2026-11-01', name: 'Toussaint', is_recurring: true },
    { date: '2026-12-25', name: 'Noël', is_recurring: true },
    { date: '2026-12-30', name: 'Fin de l\'année', is_recurring: true },
];

async function seedHolidays() {
    try {
        for (const holiday of holidays) {
            const [instance, created] = await Holiday.findOrCreate({
                where: { date: holiday.date },
                defaults: holiday
            });
            if (created) {
                console.log(`✅ Jour férié ajouté: ${holiday.name} (${holiday.date})`);
            }
        }
        console.log('✅ Tous les jours fériés ont été ajoutés');
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

seedHolidays();