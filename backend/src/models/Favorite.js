import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Favorite = sequelize.define('Favorite', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    entity_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    service_id: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'favorites'
});

export default Favorite;
