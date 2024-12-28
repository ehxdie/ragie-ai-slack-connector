"use strict";
import { Model, DataTypes } from "sequelize";
export default (sequelize) => {
    class Message extends Model {
        static associate(models) {
            this.belongsTo(models.SlackInstallation, {
                foreignKey: "workspaceInstallationId",
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
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        workspaceInstallationId: {
            type: DataTypes.INTEGER,
            references: {
                model: "slack_installations",
                key: "id",
            },
        },
        channelId: {
            type: DataTypes.INTEGER,
            references: {
                model: "channels",
                key: "id",
            },
        },
        originalSenderId: DataTypes.STRING,
        messageText: DataTypes.TEXT,
        timestamp: DataTypes.DECIMAL(16, 6),
        kafkaOffset: DataTypes.BIGINT,
        processedForRag: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: "Message",
        tableName: "messages",
        timestamps: false,
    });
    return Message;
};
