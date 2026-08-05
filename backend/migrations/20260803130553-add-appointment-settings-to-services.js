'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('services', 'allow_appointment', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('services', 'slot_duration', {
      type: Sequelize.INTEGER,
      defaultValue: 15
    });
    await queryInterface.addColumn('services', 'appointment_days_ahead', {
      type: Sequelize.INTEGER,
      defaultValue: 7
    });
    await queryInterface.addColumn('services', 'appointment_start_hour', {
      type: Sequelize.INTEGER,
      defaultValue: 8
    });
    await queryInterface.addColumn('services', 'appointment_end_hour', {
      type: Sequelize.INTEGER,
      defaultValue: 17
    });
    await queryInterface.addColumn('services', 'break_start', {
      type: Sequelize.TIME,
      allowNull: true
    });
    await queryInterface.addColumn('services', 'break_end', {
      type: Sequelize.TIME,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('services', 'break_end');
    await queryInterface.removeColumn('services', 'break_start');
    await queryInterface.removeColumn('services', 'appointment_end_hour');
    await queryInterface.removeColumn('services', 'appointment_start_hour');
    await queryInterface.removeColumn('services', 'appointment_days_ahead');
    await queryInterface.removeColumn('services', 'slot_duration');
    await queryInterface.removeColumn('services', 'allow_appointment');
  }
};