// FILE: models/ticketModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Counter from "./counterModel";
import Transaction from "./transactionModel";

interface TicketAttributes {
  id: number;
  price: number;
  dropdown_name: string;
  show_name: string;
  counter_id?: number | null;
  is_analytics: boolean;
  deleted: boolean; // Add this field
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TicketCreationAttributes
  extends Optional<
    TicketAttributes,
    "id" | "createdAt" | "updatedAt" | "counter_id" | "is_analytics" | "deleted"
  > {}

class Ticket
  extends Model<TicketAttributes, TicketCreationAttributes>
  implements TicketAttributes
{
  public id!: number;
  public price!: number;
  public dropdown_name!: string;
  public show_name!: string;
  public counter_id?: number | null;
  public is_analytics!: boolean;
  public deleted!: boolean; // Add this field
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Ticket.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    dropdown_name: { type: DataTypes.STRING, allowNull: false },
    show_name: { type: DataTypes.STRING, allowNull: false },
    counter_id: { type: DataTypes.INTEGER, allowNull: true },
    is_analytics: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    deleted: {
      // Add this field
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "Ticket",
    tableName: "tickets",
    timestamps: true,
  }
);

Ticket.belongsTo(Counter, { foreignKey: "counter_id", as: "counter" });

export default Ticket;
