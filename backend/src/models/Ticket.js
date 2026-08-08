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
    // ✅ AJOUTER CE CHAMP
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
        defaultValue: 'pending'
    }
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'tickets',
    underscored: true
});
//  LES ASSOCIATIONS
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
};




export default Ticket;
