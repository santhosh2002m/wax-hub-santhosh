import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Clear existing data first
    await queryInterface.bulkDelete("invoice_counters", {});

    // Initialize invoice counter
    await queryInterface.bulkInsert("invoice_counters", [
      {
        last_user_invoice: 0,
        last_special_invoice: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("invoice_counters", {});
  },
};
