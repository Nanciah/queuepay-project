import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },

     // ✅ AJOUTER company_id
    company_id: {
        type: DataTypes.UUID,
        allowNull: true  // Peut être null pour les transactions sans entreprise
    },
    
    ticket_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('deposit', 'ticket_purchase', 'refund', 'withdrawal', 'commission'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    payment_method: { 
        type: DataTypes.ENUM('mvola', 'orange_money', 'wallet'),
        allowNull: false
    },
    reference: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'success', 'failed', 'cancelled'),
        defaultValue: 'pending'
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    provider: {  
        type: DataTypes.STRING(50),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'transactions',
    underscored: true
});

export default Transaction;