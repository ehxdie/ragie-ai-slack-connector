"use strict";
import { Model, DataTypes } from "sequelize";
export default (sequelize) => {
    class Channel extends Model {
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
        channelName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: "Channel",
        tableName: "channels",
        timestamps: false,
    });
    return Channel;
};
