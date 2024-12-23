'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_queries', {
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
      userSlackId: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      queryText: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      responseText: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      referencedMessageIds: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true,
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

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_queries');
  }
};
