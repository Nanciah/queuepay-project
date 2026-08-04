import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'company_admin', 'agent', 'client'),
        defaultValue: 'client',
        allowNull: false
    },
    company_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    agent_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('active', 'suspended', 'inactive'),
        defaultValue: 'active'
    },
    phone_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    refresh_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    },
    language: {
        type: DataTypes.ENUM('fr', 'en', 'mg'),
        defaultValue: 'fr'
    },

       assigned_services: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
        allowNull: true
    }

  

}, {
    timestamps: true,
    //paranoid: true,
    tableName: 'users',
    underscored: true
});
// ✅ AJOUTER LES ASSOCIATIONS
User.associate = (models) => {
    User.hasMany(models.Service, {
        foreignKey: 'agent_id',
        as: 'services'
    });
    User.hasMany(models.Ticket, {
        foreignKey: 'user_id',
        as: 'tickets'
    });
    User.hasMany(models.Ticket, {
        foreignKey: 'agent_id',
        as: 'processedTickets'
    });
    User.belongsTo(models.Entity, {
        foreignKey: 'company_id',
        as: 'company'
    });
};



export default User;
