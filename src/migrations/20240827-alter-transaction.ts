// migrations/20240827-alter-transaction.ts
import { QueryInterface, DataTypes } from "sequelize";

export = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    const tableExists = await queryInterface.tableExists("Transactions");
    if (!tableExists) {
      console.log(
        "Table Transactions does not exist, skipping column operations"
      );
      return;
    }

    const tableDescription = await queryInterface.describeTable("Transactions");

    if (!tableDescription.child_count) {
      await queryInterface.addColumn("Transactions", "child_count", {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      });
      console.log("Column child_count added to Transactions");
    } else {
      console.log("Column child_count already exists, skipping addition");
    }

    if (!tableDescription.category) {
      await queryInterface.addColumn("Transactions", "category", {
        type: Sequelize.ENUM("Adult", "Child", "Senior", "Group", "Other"),
        allowNull: false,
        defaultValue: "Other",
      });
      console.log("Column category added to Transactions");
    } else {
      console.log("Column category already exists, skipping addition");
    }
  },
  down: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    const tableExists = await queryInterface.tableExists("Transactions");
    if (!tableExists) {
      console.log(
        "Table Transactions does not exist, skipping column operations"
      );
      return;
    }

    const tableDescription = await queryInterface.describeTable("Transactions");

    if (tableDescription.child_count) {
      await queryInterface.removeColumn("Transactions", "child_count");
      console.log("Column child_count removed from Transactions");
    } else {
      console.log("Column child_count does not exist, skipping removal");
    }

    if (tableDescription.category) {
      await queryInterface.removeColumn("Transactions", "category");
      console.log("Column category removed from Transactions");
    } else {
      console.log("Column category not found, skipping removal");
    }
  },
};
