'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tickets', 'appointment_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
    await queryInterface.addColumn('tickets', 'appointment_time', {
      type: Sequelize.TIME,
      allowNull: true
    });
    await queryInterface.addColumn('tickets', 'time_slot_id', {
      type: Sequelize.UUID,
      allowNull: true
    });
    await queryInterface.addColumn('tickets', 'position_in_slot', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn('tickets', 'refund_amount', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    });
    await queryInterface.addColumn('tickets', 'refund_status', {
      type: Sequelize.ENUM('none', 'pending', 'completed', 'failed'),
      defaultValue: 'none'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tickets', 'refund_status');
    await queryInterface.removeColumn('tickets', 'refund_amount');
    await queryInterface.removeColumn('tickets', 'position_in_slot');
    await queryInterface.removeColumn('tickets', 'time_slot_id');
    await queryInterface.removeColumn('tickets', 'appointment_time');
    await queryInterface.removeColumn('tickets', 'appointment_date');
  }
};