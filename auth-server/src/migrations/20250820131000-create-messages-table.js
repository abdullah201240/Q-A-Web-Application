'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      conversationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('user', 'assistant'),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      attachmentsJson: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
    });
    await queryInterface.addIndex('messages', ['conversationId']);
    await queryInterface.addIndex('messages', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('messages');
  }
};


