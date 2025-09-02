import { QueryInterface, DataTypes } from "sequelize";

export = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    const tableExists = await queryInterface.tableExists("Tickets");
    if (!tableExists) {
      console.log("Table Tickets does not exist, skipping operations");
      return;
    }

    const tableDescription = await queryInterface.describeTable("Tickets");
    if (tableDescription.dropdown_name && !tableDescription.ticket_type) {
      await queryInterface.renameColumn(
        "Tickets",
        "dropdown_name",
        "ticket_type"
      );
      console.log("Column dropdown_name renamed to ticket_type");
    } else {
      console.log(
        "Column dropdown_name not found or ticket_type already exists, skipping rename"
      );
    }

    if (!tableDescription.category) {
      await queryInterface.addColumn("Tickets", "category", {
        type: Sequelize.ENUM("Adult", "Child", "Senior", "Group", "Other"),
        allowNull: false,
        defaultValue: "Other",
      });
      console.log("Column category added to Tickets");
    } else {
      console.log("Column category already exists, skipping addition");
    }
  },
  down: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    const tableExists = await queryInterface.tableExists("Tickets");
    if (!tableExists) {
      console.log("Table Tickets does not exist, skipping column operations");
      return;
    }

    const tableDescription = await queryInterface.describeTable("Tickets");
    if (tableDescription.ticket_type) {
      await queryInterface.renameColumn(
        "Tickets",
        "ticket_type",
        "dropdown_name"
      );
      console.log("Column ticket_type renamed to dropdown_name");
    } else {
      console.log("Column ticket_type not found, skipping rename");
    }

    if (tableDescription.category) {
      await queryInterface.removeColumn("Tickets", "category");
      console.log("Column category removed from Tickets");
    } else {
      console.log("Column category not found, skipping removal");
    }
  },
};
