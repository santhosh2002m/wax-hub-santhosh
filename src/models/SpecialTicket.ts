// FILE: models/SpecialTicket.ts
import { DataTypes, Model, Optional, Association } from "sequelize";
import sequelize from "../config/database";
import Counter from "./counterModel";

interface SpecialTicketAttributes {
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
  counter_id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SpecialTicketCreationAttributes
  extends Optional<
    SpecialTicketAttributes,
    "id" | "createdAt" | "updatedAt" | "status"
  > {}

// Add this interface for the associations
interface SpecialTicketAssociations {
  counter?: Counter;
}

export class SpecialTicket
  extends Model<SpecialTicketAttributes, SpecialTicketCreationAttributes>
  implements SpecialTicketAttributes, SpecialTicketAssociations
{
  // Add the associations interface
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
  public counter_id!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Add the association property
  public counter?: Counter;

  // Add static associations if needed
  public static associations: {
    counter: Association<SpecialTicket, Counter>;
  };
}

SpecialTicket.init(
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
    counter_id: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "SpecialTicket",
    tableName: "special_tickets",
    timestamps: true,
    underscored: false,
  }
);

SpecialTicket.belongsTo(Counter, { foreignKey: "counter_id", as: "counter" });

export default SpecialTicket;
