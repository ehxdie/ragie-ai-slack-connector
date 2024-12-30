'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('slack_installations', 'scopes');
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('slack_installations', 'scopes', {
            type: Sequelize.JSONB,
            allowNull: false,
        });
    }
};
