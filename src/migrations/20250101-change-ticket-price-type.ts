// FILE: migrations/20250101-change-ticket-price-type.ts
import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    // Check if the tickets table exists
    const tableExists = await queryInterface.tableExists("tickets");
    if (!tableExists) {
      console.log("Table tickets does not exist, skipping operation");
      return;
    }

    // Change the price column from INTEGER to FLOAT
    await queryInterface.changeColumn("tickets", "price", {
      type: Sequelize.FLOAT,
      allowNull: false,
    });

    console.log("Changed tickets.price from INTEGER to FLOAT");
  },

  down: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    const tableExists = await queryInterface.tableExists("tickets");
    if (!tableExists) {
      console.log("Table tickets does not exist, skipping operation");
      return;
    }

    // Revert back to INTEGER (this might cause data loss for decimal values)
    await queryInterface.changeColumn("tickets", "price", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    console.log("Changed tickets.price from FLOAT back to INTEGER");
  },
};
