// migrations/20240826-create-counter.ts
import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.createTable("counters", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      username: { type: Sequelize.STRING(50), unique: true, allowNull: false },
      password: { type: Sequelize.STRING(255), allowNull: false },
      role: {
        type: Sequelize.ENUM("manager", "admin", "user"), // Added "user" role
        defaultValue: "manager",
        allowNull: false,
      },
      special: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("transactions", { cascade: true });
    await queryInterface.dropTable("messages", { cascade: true });
    await queryInterface.dropTable("counters", { cascade: true });
  },
};
