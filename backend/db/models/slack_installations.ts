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
  botScopes: string[];
  userScopes: string[];
  enterpriseId: string;
  isEnterpriseInstall: boolean;
  timestamp: number;
}

interface SlackInstallationCreationAttributes extends Omit<SlackInstallationAttributes, 'id'> { }

export default (sequelize: Sequelize) => {
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
    public botScopes!: string[];
    public userScopes!: string[];
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
      botScopes: DataTypes.ARRAY(DataTypes.STRING),
      userScopes: DataTypes.ARRAY(DataTypes.STRING),
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
