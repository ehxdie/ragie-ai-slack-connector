import { Model, DataTypes } from "sequelize";
export default (sequelize) => {
    class SlackInstallation extends Model {
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
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        teamId: DataTypes.STRING,
        teamName: DataTypes.STRING,
        botUserId: DataTypes.STRING,
        botAccessToken: DataTypes.STRING,
        userAccessToken: DataTypes.STRING,
        userId: DataTypes.STRING,
        appId: DataTypes.STRING,
        botScopes: DataTypes.ARRAY(DataTypes.STRING),
        userScopes: DataTypes.ARRAY(DataTypes.STRING),
        enterpriseId: DataTypes.STRING,
        isEnterpriseInstall: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        timestamp: DataTypes.BIGINT,
    }, {
        sequelize,
        modelName: "SlackInstallation",
        tableName: "slack_installations",
        timestamps: false,
    });
    return SlackInstallation;
};
