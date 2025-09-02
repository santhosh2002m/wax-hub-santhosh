import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.createTable("tickets", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      price: { type: Sequelize.FLOAT, allowNull: false },
      dropdown_name: { type: Sequelize.STRING, allowNull: false },
      show_name: { type: Sequelize.STRING, allowNull: false },
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
    await queryInterface.dropTable("tickets");
  },
};
