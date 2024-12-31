"use strict";
import { Sequelize, Model, DataTypes, Association } from "sequelize";

interface UserQueryAttributes {
  id?: number;
  workspaceInstallationId: number;
  userSlackId: string;
  queryText: string;
  responseText: string;
  referencedMessageIds: number[];
  createdAt?: Date;
}

interface UserQueryCreationAttributes extends Omit<UserQueryAttributes, "id" | "createdAt"> { }

module.exports = (sequelize: Sequelize) => {
  class UserQuery extends Model<UserQueryAttributes, UserQueryCreationAttributes> implements UserQueryAttributes {
    public id!: number;
    public workspaceInstallationId!: number;
    public userSlackId!: string;
    public queryText!: string;
    public responseText!: string;
    public referencedMessageIds!: number[];
    public createdAt!: Date;

    public static associations: {
      slackInstallation: Association<UserQuery, any>;
    };

    static associate(models: any) {
      this.belongsTo(models.SlackInstallation, {
        foreignKey: "workspaceInstallationId",
        as: "slackInstallation",
      });
    }
  }

  UserQuery.init(
    {
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
    },
    {
      sequelize,
      modelName: "UserQuery",
      tableName: "user_queries",
      timestamps: false,
    }
  );

  return UserQuery;
};
