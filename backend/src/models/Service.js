import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    entity_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
   agent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
        model: 'users',
        key: 'id'
    },
    onDelete: 'SET NULL',  
    onUpdate: 'CASCADE'
},
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    category: {
        type: DataTypes.ENUM('health', 'banking', 'administration', 'commerce', 'transport', 'education', 'other'),
        defaultValue: 'other'
    },
    ticket_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    estimated_duration: {
        type: DataTypes.INTEGER,
        defaultValue: 15
    },
    max_capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 50
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at'
    }
}, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'services'
});

export default Service;