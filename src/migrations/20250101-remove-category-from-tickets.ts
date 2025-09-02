// FILE: migrations/20250101-remove-category-from-tickets.ts
import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    const tableDescription = await queryInterface.describeTable("tickets");

    if (tableDescription.category) {
      await queryInterface.removeColumn("tickets", "category");
      console.log("Column category removed from tickets table");
    } else {
      console.log(
        "Column category does not exist in tickets table, skipping removal"
      );
    }
  },

  down: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    const tableDescription = await queryInterface.describeTable("tickets");

    if (!tableDescription.category) {
      await queryInterface.addColumn("tickets", "category", {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Other",
      });
      console.log("Column category added back to tickets table");
    } else {
      console.log(
        "Column category already exists in tickets table, skipping addition"
      );
    }
  },
};
