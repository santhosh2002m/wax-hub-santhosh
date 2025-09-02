import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface TwilioMessageAttributes {
  id: number;
  message_sid: string;
  to: string;
  from: string;
  body: string;
  status: string;
  direction: "outbound-api" | "inbound";
  price?: string | null;
  price_unit?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TwilioMessageCreationAttributes
  extends Optional<
    TwilioMessageAttributes,
    | "id"
    | "price"
    | "price_unit"
    | "error_code"
    | "error_message"
    | "createdAt"
    | "updatedAt"
  > {}

class TwilioMessage
  extends Model<TwilioMessageAttributes, TwilioMessageCreationAttributes>
  implements TwilioMessageAttributes
{
  public id!: number;
  public message_sid!: string;
  public to!: string;
  public from!: string;
  public body!: string;
  public status!: string;
  public direction!: "outbound-api" | "inbound";
  public price?: string | null;
  public price_unit?: string | null;
  public error_code?: string | null;
  public error_message?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TwilioMessage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    message_sid: { type: DataTypes.STRING, allowNull: false, unique: true },
    to: { type: DataTypes.STRING, allowNull: false },
    from: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false },
    direction: {
      type: DataTypes.ENUM("outbound-api", "inbound"),
      allowNull: false,
    },
    price: { type: DataTypes.STRING, allowNull: true },
    price_unit: { type: DataTypes.STRING, allowNull: true },
    error_code: { type: DataTypes.STRING, allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "TwilioMessage",
    tableName: "twilio_messages",
    timestamps: true,
  }
);

export default TwilioMessage;
