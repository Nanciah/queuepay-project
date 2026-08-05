import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TimeSlot = sequelize.define('TimeSlot', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    service_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    max_capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    booked_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_available: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'time_slots',
    underscored: true
});

export default TimeSlot;