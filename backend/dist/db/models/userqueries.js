"use strict";
import { Model, DataTypes } from "sequelize";
export default (sequelize) => {
    class UserQuery extends Model {
        static associate(models) {
            this.belongsTo(models.SlackInstallation, {
                foreignKey: "workspaceInstallationId",
                as: "slackInstallation",
            });
        }
    }
    UserQuery.init({
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
        userSlackId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        queryText: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        responseText: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        referencedMessageIds: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: "UserQuery",
        tableName: "user_queries",
        timestamps: false,
    });
    return UserQuery;
};
