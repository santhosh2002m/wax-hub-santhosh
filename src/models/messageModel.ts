// models/messageModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Counter from "./counterModel";

interface MessageAttributes {
  id: number;
  message: string;
  counter_id: number | null; // Allow null
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes
  extends Optional<MessageAttributes, "id" | "createdAt" | "updatedAt"> {}

class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: number;
  public message!: string;
  public counter_id!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    message: {
      type: DataTypes.TEXT, // Changed to TEXT to match migration
      allowNull: false,
    },
    counter_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "counters",
        key: "id",
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    timestamps: true,
  }
);

Message.belongsTo(Counter, { foreignKey: "counter_id", as: "counter" });

export default Message;
