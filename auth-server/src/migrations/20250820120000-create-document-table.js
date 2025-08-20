'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      originalFilename: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
      mimeType: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      sizeBytes: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      storagePath: {
        type: Sequelize.STRING(1024),
        allowNull: false,
      },
      textContent: {
        type: Sequelize.TEXT('long'),
        allowNull: false,
      },
      checksum: {
        type: Sequelize.STRING(64),
        allowNull: true,
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
    await queryInterface.addIndex('documents', ['userId']);
    await queryInterface.addIndex('documents', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('documents');
  }
};


