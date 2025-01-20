"use strict";
import { Sequelize, Model, DataTypes, Association } from "sequelize";


interface ChannelAttributes {
  id?: number;
  slackInstallationId: number;
  channelName: string;
  createdAt?: Date;
}

interface ChannelCreationAttributes extends Omit<ChannelAttributes, "id" | "createdAt"> { }

module.exports = (sequelize: Sequelize) => {
  class Channel extends Model<ChannelAttributes, ChannelCreationAttributes> implements ChannelAttributes {
    public id!: number;
    public slackInstallationId!: number;
    public channelName!: string;
    public createdAt!: Date;

    public static associations: {
      slackInstallation: Association<Channel, any>;
      messages: Association<Channel, any>;
    };

    static associate(models: any) {
      this.belongsTo(models.SlackInstallation, {
        foreignKey: "slackInstallationId",
        as: "slackInstallation",
      });
      this.hasMany(models.Message, {
        foreignKey: "channelId",
        as: "messages",
      });
    }
  }

  Channel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      slackInstallationId: {
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
    },
    {
      sequelize,
      modelName: "Channel",
      tableName: "channels",
      timestamps: false,
    }
  );

  return Channel;
};
