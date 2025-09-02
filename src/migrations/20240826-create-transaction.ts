import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.createTable("transactions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      invoice_no: { type: Sequelize.STRING, allowNull: false, unique: true },
      date: { type: Sequelize.DATE, allowNull: false },
      adult_count: { type: Sequelize.INTEGER, allowNull: false },
      child_count: { type: Sequelize.INTEGER, allowNull: false },
      category: { type: Sequelize.STRING, allowNull: false },
      total_paid: { type: Sequelize.FLOAT, allowNull: false },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "tickets", key: "id" },
      },
      counter_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "counters", key: "id" },
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("transactions");
  },
};
