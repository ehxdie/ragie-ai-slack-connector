'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface:any, Sequelize:any) {
    await queryInterface.createTable('messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      slackInstallationId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'slack_installations',  // Updated reference
          key: 'id',
        },
        allowNull: false,
        onDelete: 'CASCADE',
      },
      channelId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'channels',
          key: 'id',
        },
        allowNull: false,
        onDelete: 'CASCADE',
      },
      originalSenderId: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      messageText: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DECIMAL(16, 6),
        allowNull: false,
      },
      kafkaOffset: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      processedForRag: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down (queryInterface:any, Sequelize:any) {
    await queryInterface.dropTable('messages');
  }
};
