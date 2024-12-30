'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: any, Sequelize: any) {
    await queryInterface.removeColumn('slack_installations', 'scopes');
  },

  async down(queryInterface: any, Sequelize: any) {
    await queryInterface.addColumn('slack_installations', 'scopes', {
      type: Sequelize.JSONB,
      allowNull: false,
    });
  }
};
