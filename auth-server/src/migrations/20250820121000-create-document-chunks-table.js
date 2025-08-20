'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('document_chunks', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      documentId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      chunkIndex: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      text: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
    });
    await queryInterface.addIndex('document_chunks', ['documentId']);
    await queryInterface.addIndex('document_chunks', ['chunkIndex']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('document_chunks');
  }
};


