// models/counterModel.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface CounterAttributes {
  id: number;
  username: string;
  password: string;
  role: "manager" | "admin" | "user"; // Added "user" role
  special: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CounterCreationAttributes
  extends Optional<
    CounterAttributes,
    "id" | "createdAt" | "updatedAt" | "role" | "special"
  > {}

class Counter
  extends Model<CounterAttributes, CounterCreationAttributes>
  implements CounterAttributes
{
  public id!: number;
  public username!: string;
  public password!: string;
  public role!: "manager" | "admin" | "user"; // Updated role type
  public special!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Counter.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM("manager", "admin", "user"), // Updated ENUM
      defaultValue: "manager",
      allowNull: false,
    },
    special: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: "Counter",
    tableName: "counters",
    timestamps: true,
    underscored: false,
  }
);

export default Counter;
