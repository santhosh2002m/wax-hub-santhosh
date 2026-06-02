import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface InvoiceCounterAttributes {
  id: number;
  last_user_invoice: number;
  last_special_invoice: number;
  reset_date?: Date | null;
  has_reset_occurred?: boolean;
  current_year_prefix?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InvoiceCounterCreationAttributes
  extends Optional<
    InvoiceCounterAttributes,
    "id" | "createdAt" | "updatedAt"
  > {}

class InvoiceCounter
  extends Model<InvoiceCounterAttributes, InvoiceCounterCreationAttributes>
  implements InvoiceCounterAttributes
{
  public id!: number;
  public last_user_invoice!: number;
  public last_special_invoice!: number;
  public reset_date!: Date | null;
  public has_reset_occurred!: boolean;
  public current_year_prefix!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InvoiceCounter.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    last_user_invoice: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    last_special_invoice: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    reset_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    has_reset_occurred: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    current_year_prefix: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "InvoiceCounter",
    tableName: "invoice_counters",
    timestamps: true,
  }
);

export default InvoiceCounter;
