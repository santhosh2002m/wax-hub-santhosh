// migrations/update-ticket-transaction-relation.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Remove the existing foreign key constraint
      await queryInterface.removeConstraint(
        "transactions",
        "transactions_ticket_id_fkey"
      );

      // Add the new foreign key constraint with ON DELETE SET NULL
      await queryInterface.addConstraint("transactions", {
        fields: ["ticket_id"],
        type: "foreign key",
        name: "transactions_ticket_id_fkey",
        references: {
          table: "tickets",
          field: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });

      console.log(
        "✅ Migration up: Updated ticket → transaction relation successfully"
      );
    } catch (error) {
      console.error("❌ Migration up failed:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revert back to the original constraint
      await queryInterface.removeConstraint(
        "transactions",
        "transactions_ticket_id_fkey"
      );

      await queryInterface.addConstraint("transactions", {
        fields: ["ticket_id"],
        type: "foreign key",
        name: "transactions_ticket_id_fkey",
        references: {
          table: "tickets",
          field: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });

      console.log(
        "✅ Migration down: Reverted ticket → transaction relation successfully"
      );
    } catch (error) {
      console.error("❌ Migration down failed:", error);
      throw error;
    }
  },
};
