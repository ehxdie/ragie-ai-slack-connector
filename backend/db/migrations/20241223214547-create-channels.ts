'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface:any, Sequelize:any) {
    await queryInterface.createTable('channels', {
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
      channelName: {
        type: Sequelize.STRING(100),
        allowNull: false,
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
    await queryInterface.dropTable('channels');
  }
};
