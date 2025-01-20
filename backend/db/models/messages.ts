"use strict";
import { Sequelize, Model, DataTypes, Association } from "sequelize";

interface MessageAttributes {
  id?: number;
  slackInstallationId: number;
  channelId: number;
  originalSenderId: string;
  messageText: string;
  timestamp: number;
  kafkaOffset: number;
  processedForRag: boolean;
  createdAt?: Date;
}

interface MessageCreationAttributes extends Omit<MessageAttributes, 'id' | 'createdAt'> {}

module.exports = (sequelize: Sequelize) => {
  class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    public id!: number;
    public slackInstallationId!: number;
    public channelId!: number;
    public originalSenderId!: string;
    public messageText!: string;
    public timestamp!: number;
    public kafkaOffset!: number;
    public processedForRag!: boolean;
    public createdAt!: Date;

    public static associations: {
      slackInstallation: Association<Message, any>;
      channel: Association<Message, any>;
    };

    static associate(models: any) {
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

  Message.init(
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
    },
    {
      sequelize,
      modelName: "Message",
      tableName: "messages",
      timestamps: false,
    }
  );

  return Message;
};
