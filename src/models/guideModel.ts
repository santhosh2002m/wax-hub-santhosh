import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface GuideAttributes {
  id: number;
  name: string;
  number?: string;
  vehicle_type?: string;
  score: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GuideCreationAttributes
  extends Optional<GuideAttributes, "id" | "createdAt" | "updatedAt"> {}

class Guide
  extends Model<GuideAttributes, GuideCreationAttributes>
  implements GuideAttributes
{
  public id!: number;
  public name!: string;
  public number?: string;
  public vehicle_type?: string;
  public score!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Guide.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    number: {
      type: DataTypes.STRING(20),
      unique: true,
    },
    vehicle_type: {
      type: DataTypes.STRING(50),
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Guide",
    tableName: "Guides",
  }
);

export default Guide;
