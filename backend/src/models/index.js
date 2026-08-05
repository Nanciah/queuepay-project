import sequelize from '../config/database.js';

// ========== IMPORTER TOUS LES MODÈLES ==========
import User from './User.js';
import Entity from './Entity.js';
import Service from './Service.js';
import Ticket from './Ticket.js';
import Transaction from './Transaction.js';
import AuditLog from './AuditLog.js';
import Favorite from './Favorite.js';
import Notification from './Notification.js';
import QueueEvent from './QueueEvent.js';
import PasswordReset from './PasswordReset.js';
import TimeSlot from './TimeSlot.js';


// ========== REGROUPER TOUS LES MODÈLES ==========
const models = {
  User,
  Entity,
  Service,
  Ticket,
  Transaction,
  AuditLog,
  Favorite,
  Notification,
  QueueEvent,
  PasswordReset,
  TimeSlot
};

// ========== DÉFINIR LES ASSOCIATIONS ==========

// ===== USER ASSOCIATIONS =====
User.hasMany(Ticket, { foreignKey: 'user_id', as: 'tickets' });
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
User.hasMany(Favorite, { foreignKey: 'user_id', as: 'favorites' });
User.belongsTo(Entity, { foreignKey: 'company_id', as: 'company' });

// ===== TIMESLOT ASSOCIATIONS =====
TimeSlot.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
TimeSlot.hasMany(Ticket, { foreignKey: 'time_slot_id', as: 'tickets' });

// ===== ENTITY (COMPANY) ASSOCIATIONS =====
Entity.hasMany(User, { foreignKey: 'company_id', as: 'users' });
Entity.hasMany(Service, { foreignKey: 'entity_id', as: 'services' });
Entity.hasMany(Transaction, { foreignKey: 'company_id', as: 'transactions' });

// ===== SERVICE ASSOCIATIONS =====
Service.belongsTo(Entity, { foreignKey: 'entity_id', as: 'entity' });
Service.hasMany(Ticket, { foreignKey: 'service_id', as: 'tickets' });
Service.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });

// ===== TICKET ASSOCIATIONS =====
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'client' });
Ticket.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
Ticket.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });

// ===== TRANSACTION ASSOCIATIONS =====
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Transaction.belongsTo(Entity, { foreignKey: 'company_id', as: 'company' });
Transaction.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

// ===== FAVORITE ASSOCIATIONS =====
Favorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Favorite.belongsTo(Entity, { foreignKey: 'entity_id', as: 'entity' });
Favorite.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// ===== NOTIFICATION ASSOCIATIONS =====
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ===== AUDIT LOG ASSOCIATIONS =====
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ========== EXPORTER ==========
export { sequelize };
export default models;
export {
    User,
    Entity,
    Service,
    Ticket,
    Transaction,
    AuditLog,
    Favorite,
    Notification,
    QueueEvent,
    TimeSlot,
    PasswordReset
};