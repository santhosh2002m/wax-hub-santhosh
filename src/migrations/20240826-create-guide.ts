import { QueryInterface, DataTypes } from "sequelize";
module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.createTable("guides", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      vehicle_type: { type: Sequelize.STRING(50), allowNull: false },
      score: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      total_bookings: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      rating: {
        type: Sequelize.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive"),
        defaultValue: "active",
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        field: "created_at",
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        field: "updated_at",
      },
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("guides");
  },
};
