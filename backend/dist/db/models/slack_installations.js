"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = (sequelize) => {
    class SlackInstallation extends sequelize_1.Model {
        static associate(models) {
            // Define associations here
            this.hasMany(models.Channel, {
                foreignKey: "workspaceInstallationId",
                as: "channels",
            });
            this.hasMany(models.Message, {
                foreignKey: "workspaceInstallationId",
                as: "messages",
            });
            this.hasMany(models.UserQuery, {
                foreignKey: "workspaceInstallationId",
                as: "userQueries",
            });
        }
    }
    SlackInstallation.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        teamId: sequelize_1.DataTypes.STRING,
        teamName: sequelize_1.DataTypes.STRING,
        botUserId: sequelize_1.DataTypes.STRING,
        botAccessToken: sequelize_1.DataTypes.STRING,
        userAccessToken: sequelize_1.DataTypes.STRING,
        userId: sequelize_1.DataTypes.STRING,
        appId: sequelize_1.DataTypes.STRING,
        enterpriseId: sequelize_1.DataTypes.STRING,
        isEnterpriseInstall: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        timestamp: sequelize_1.DataTypes.BIGINT,
    }, {
        sequelize,
        modelName: "SlackInstallation",
        tableName: "slack_installations",
        timestamps: false,
    });
    return SlackInstallation;
};
