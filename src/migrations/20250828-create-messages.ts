import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.createTable("messages", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      message: { type: Sequelize.TEXT, allowNull: false },
      counter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "counters", key: "id" },
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("messages");
  },
};
