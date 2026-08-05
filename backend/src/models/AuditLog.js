import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    action: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    entity_id: {
        type: DataTypes.UUID
    },
    details: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    ip_address: {
        type: DataTypes.INET
    },
    user_agent: {
        type: DataTypes.TEXT
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'audit_logs',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['action'] },
        { fields: ['created_at'] }
    ]
});

export default AuditLog;
