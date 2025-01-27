'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Altering the userAccessToken column to allow NULL values (make it optional)
        await queryInterface.changeColumn('slack_installations', 'userAccessToken', {
            type: Sequelize.STRING, // Or whatever type it currently is
            allowNull: true, // This makes the column optional
        });
    },
    async down(queryInterface, Sequelize) {
        // Reverting the column to not allow NULL values
        await queryInterface.changeColumn('slack_installations', 'userAccessToken', {
            type: Sequelize.STRING, // Or the current type of the column
            allowNull: false, // This will make the column required again
        });
    }
};
