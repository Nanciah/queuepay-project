import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Holiday = sequelize.define('Holiday', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_recurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    entity_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Si null, jour férié national'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'holidays',
    underscored: true
});

export default Holiday;