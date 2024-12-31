"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = (sequelize) => {
    class UserQuery extends sequelize_1.Model {
        static associate(models) {
            this.belongsTo(models.SlackInstallation, {
                foreignKey: "workspaceInstallationId",
                as: "slackInstallation",
            });
        }
    }
    UserQuery.init({
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
        userSlackId: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        queryText: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        responseText: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        referencedMessageIds: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.INTEGER),
            allowNull: false,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: "UserQuery",
        tableName: "user_queries",
        timestamps: false,
    });
    return UserQuery;
};
