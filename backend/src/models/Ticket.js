import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Ticket = sequelize.define('Ticket', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    service_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    agent_id: {  
        type: DataTypes.UUID,
        allowNull: true
    },
    ticket_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    priority: {
        type: DataTypes.ENUM('standard', 'priority', 'emergency'),
        defaultValue: 'standard'
    },
    status: {
        type: DataTypes.ENUM('pending', 'waiting', 'called', 'processing', 'completed', 'cancelled', 'no_show'),
        defaultValue: 'pending'
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    estimated_wait_time: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    called_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cancellation_reason: {  
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
        defaultValue: 'pending'
    },
    // ✅ AJOUT : COLONNES POUR LES RENDEZ-VOUS
    appointment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Date du rendez-vous (YYYY-MM-DD)'
    },
    appointment_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Heure du rendez-vous (HH:MM)'
    },
    time_slot_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Référence vers le créneau horaire réservé'
    },
    // ✅ AJOUT : REMBOURSEMENT
    refund_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        comment: 'Montant remboursé'
    },
    refund_status: {
        type: DataTypes.ENUM('none', 'pending', 'completed', 'failed'),
        defaultValue: 'none',
        comment: 'Statut du remboursement'
    },
    // ✅ AJOUT : POSITION DANS LE CRÉNEAU
    position_in_slot: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Position dans le créneau horaire (1er, 2ème, etc.)'
    }
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'tickets',
    underscored: true
});

// ✅ LES ASSOCIATIONS
Ticket.associate = (models) => {
    Ticket.belongsTo(models.Service, {
        foreignKey: 'service_id',
        as: 'service'
    });
    Ticket.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'client'
    });
    Ticket.belongsTo(models.User, {
        foreignKey: 'agent_id',
        as: 'agent'
    });
    // ✅ AJOUT : ASSOCIATION AVEC TIME_SLOT
    Ticket.belongsTo(models.TimeSlot, {
        foreignKey: 'time_slot_id',
        as: 'timeSlot'
    });
};

export default Ticket;