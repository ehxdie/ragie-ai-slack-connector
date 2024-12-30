'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('slack_installations', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            teamId: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            teamName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            botUserId: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            botAccessToken: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            userAccessToken: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            userId: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            appId: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            scopes: {
                type: Sequelize.JSONB,
                allowNull: false,
            },
            enterpriseId: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            isEnterpriseInstall: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
            timestamp: {
                type: Sequelize.BIGINT,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('slack_installations');
    },
};
