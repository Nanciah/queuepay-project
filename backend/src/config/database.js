import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'queuepay',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
    },
    // ✅ AJOUTER CES OPTIONS SSL
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Nécessaire pour Render
      }
    }
  }
);

export default sequelize;
