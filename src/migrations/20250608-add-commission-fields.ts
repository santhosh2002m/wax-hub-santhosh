import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    await queryInterface.sequelize!.query(
      `ALTER TYPE "enum_counters_role" ADD VALUE IF NOT EXISTS 'commission';`
    );

    await queryInterface.addColumn("user_tickets", "commission_paid", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("user_tickets", "commission_paid_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("special_tickets", "commission_paid", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("special_tickets", "commission_paid_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("special_tickets", "commission_paid_at");
    await queryInterface.removeColumn("special_tickets", "commission_paid");
    await queryInterface.removeColumn("user_tickets", "commission_paid_at");
    await queryInterface.removeColumn("user_tickets", "commission_paid");
  },
};
