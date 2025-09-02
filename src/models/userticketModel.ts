// src/models/userticketModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Counter from "./counterModel";

interface UserTicketAttributes {
  id: number;
  invoice_no: string;
  vehicle_type: string;
  guide_name: string;
  guide_number: string;
  show_name: string;
  adults: number;
  ticket_price: number;
  total_price: number;
  tax: number;
  final_amount: number;
  status: "pending" | "completed" | "cancelled";
  user_id: number;
  counter_id?: number; // Add optional counter_id
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserTicketCreationAttributes
  extends Optional<
    UserTicketAttributes,
    "id" | "createdAt" | "updatedAt" | "status" | "counter_id"
  > {}

export class UserTicket
  extends Model<UserTicketAttributes, UserTicketCreationAttributes>
  implements UserTicketAttributes
{
  public id!: number;
  public invoice_no!: string;
  public vehicle_type!: string;
  public guide_name!: string;
  public guide_number!: string;
  public show_name!: string;
  public adults!: number;
  public ticket_price!: number;
  public total_price!: number;
  public tax!: number;
  public final_amount!: number;
  public status!: "pending" | "completed" | "cancelled";
  public user_id!: number;
  public counter_id?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserTicket.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoice_no: { type: DataTypes.STRING, allowNull: false, unique: true },
    vehicle_type: { type: DataTypes.STRING, allowNull: false },
    guide_name: { type: DataTypes.STRING, allowNull: false },
    guide_number: { type: DataTypes.STRING, allowNull: false },
    show_name: { type: DataTypes.STRING, allowNull: false },
    adults: { type: DataTypes.INTEGER, allowNull: false },
    ticket_price: { type: DataTypes.FLOAT, allowNull: false },
    total_price: { type: DataTypes.FLOAT, allowNull: false },
    tax: { type: DataTypes.FLOAT, allowNull: false },
    final_amount: { type: DataTypes.FLOAT, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "completed", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    counter_id: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "UserTicket",
    tableName: "user_tickets",
    timestamps: true,
    underscored: false,
  }
);

UserTicket.belongsTo(Counter, { foreignKey: "counter_id", as: "counter" });

export default UserTicket;
