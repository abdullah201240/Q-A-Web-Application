'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Backfill any existing NULL userId to 0 to allow NOT NULL constraint
    await queryInterface.sequelize.query('UPDATE documents SET userId = 0 WHERE userId IS NULL');
    await queryInterface.changeColumn('documents', 'userId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('documents', 'userId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    });
  }
};


