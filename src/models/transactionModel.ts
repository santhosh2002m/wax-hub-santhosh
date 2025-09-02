import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Counter from "./counterModel";
import Ticket from "./ticketModel";

interface TransactionAttributes {
  id: number;
  invoice_no: string;
  date: Date;
  adult_count: number;
  child_count: number;
  category: string;
  total_paid: number;
  ticket_id: number;
  counter_id: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionCreationAttributes
  extends Optional<
    TransactionAttributes,
    "id" | "createdAt" | "updatedAt" | "counter_id"
  > {}

class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  public id!: number;
  public invoice_no!: string;
  public date!: Date;
  public adult_count!: number;
  public child_count!: number;
  public category!: string;
  public total_paid!: number;
  public ticket_id!: number;
  public counter_id!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Transaction.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoice_no: { type: DataTypes.STRING, allowNull: false, unique: true },
    date: { type: DataTypes.DATE, allowNull: false },
    adult_count: { type: DataTypes.INTEGER, allowNull: false },
    child_count: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    total_paid: { type: DataTypes.FLOAT, allowNull: false },
    ticket_id: { type: DataTypes.INTEGER, allowNull: false },
    counter_id: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "transactions",
    timestamps: true,
  }
);

Transaction.belongsTo(Ticket, { foreignKey: "ticket_id", as: "ticket" });
Transaction.belongsTo(Counter, { foreignKey: "counter_id", as: "counter" });

export default Transaction;
