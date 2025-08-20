'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversation_documents', {
      conversationId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      documentId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
    });
    await queryInterface.addIndex('conversation_documents', ['conversationId', 'documentId'], { unique: true });
    await queryInterface.addIndex('conversation_documents', ['documentId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('conversation_documents');
  }
};


