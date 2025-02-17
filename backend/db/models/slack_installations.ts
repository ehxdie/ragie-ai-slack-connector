import { Sequelize, Model, DataTypes, Association } from "sequelize";

interface SlackInstallationAttributes {
  id?: number;
  teamId: string;
  teamName: string;
  botUserId: string;
  botAccessToken: string;
  userAccessToken: string;
  userId: string;
  appId: string;
  enterpriseId: string;
  isEnterpriseInstall: boolean;
  timestamp: number;
}

interface SlackInstallationCreationAttributes extends Omit<SlackInstallationAttributes, 'id'> {}

module.exports = (sequelize: Sequelize) => {
  class SlackInstallation extends Model<SlackInstallationAttributes, SlackInstallationCreationAttributes>
    implements SlackInstallationAttributes {
    public id!: number;
    public teamId!: string;
    public teamName!: string;
    public botUserId!: string;
    public botAccessToken!: string;
    public userAccessToken!: string;
    public userId!: string;
    public appId!: string;
    public enterpriseId!: string;
    public isEnterpriseInstall!: boolean;
    public timestamp!: number;

    public static associations: {
      channels: Association<SlackInstallation, any>;
      messages: Association<SlackInstallation, any>;
      userQueries: Association<SlackInstallation, any>;
    };

    static associate(models: any) {
      // Define associations here
      this.hasMany(models.Channel, {
        foreignKey: "slackInstallationId",
        as: "channels",
      });
      this.hasMany(models.Message, {
        foreignKey: "slackInstallationId",
        as: "messages",
      });
      this.hasMany(models.UserQuery, {
        foreignKey: "slackInstallationId",
        as: "userQueries",
      });
    }
  }

  SlackInstallation.init(
    {
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
      enterpriseId: DataTypes.STRING,
      isEnterpriseInstall: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      timestamp: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: "SlackInstallation",
      tableName: "slack_installations",
      timestamps: false,
    }
  );

  return SlackInstallation;
};
