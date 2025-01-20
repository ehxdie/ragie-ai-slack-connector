"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = (sequelize) => {
    class Message extends sequelize_1.Model {
        static associate(models) {
            this.belongsTo(models.SlackInstallation, {
                foreignKey: "slackInstallationId",
                as: "slackInstallation",
            });
            this.belongsTo(models.Channel, {
                foreignKey: "channelId",
                as: "channel",
            });
        }
    }
    Message.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        slackInstallationId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: "slack_installations",
                key: "id",
            },
        },
        channelId: {
            type: sequelize_1.DataTypes.INTEGER,
            references: {
                model: "channels",
                key: "id",
            },
        },
        originalSenderId: sequelize_1.DataTypes.STRING,
        messageText: sequelize_1.DataTypes.TEXT,
        timestamp: sequelize_1.DataTypes.DECIMAL(16, 6),
        kafkaOffset: sequelize_1.DataTypes.BIGINT,
        processedForRag: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: "Message",
        tableName: "messages",
        timestamps: false,
    });
    return Message;
};
