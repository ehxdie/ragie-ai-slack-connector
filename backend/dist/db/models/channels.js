"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = (sequelize) => {
    class Channel extends sequelize_1.Model {
        static associate(models) {
            this.belongsTo(models.SlackInstallation, {
                foreignKey: "workspaceInstallationId",
                as: "slackInstallation",
            });
            this.hasMany(models.Message, {
                foreignKey: "channelId",
                as: "messages",
            });
        }
    }
    Channel.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        workspaceInstallationId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: "slack_installations",
                key: "id",
            },
        },
        channelName: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: "Channel",
        tableName: "channels",
        timestamps: false,
    });
    return Channel;
};
