import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QueueEvent = sequelize.define('QueueEvent', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    service_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    event_type: {
        type: DataTypes.ENUM('ticket_created', 'ticket_called', 'ticket_completed', 'ticket_cancelled', 'queue_updated'),
        allowNull: false
    },
    data: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'queue_events'
});

export default QueueEvent;
