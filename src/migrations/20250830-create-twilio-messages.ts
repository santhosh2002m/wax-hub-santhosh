// FILE: migrations/20250830-create-twilio-messages.ts
import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize: typeof DataTypes) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists("twilio_messages");

    if (!tableExists) {
      await queryInterface.createTable("twilio_messages", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        message_sid: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        to: { type: Sequelize.STRING, allowNull: false },
        from: { type: Sequelize.STRING, allowNull: false },
        body: { type: Sequelize.TEXT, allowNull: false },
        status: { type: Sequelize.STRING, allowNull: false },
        direction: {
          type: Sequelize.ENUM("outbound-api", "inbound"),
          allowNull: false,
        },
        price: { type: Sequelize.STRING, allowNull: true },
        price_unit: { type: Sequelize.STRING, allowNull: true },
        error_code: { type: Sequelize.STRING, allowNull: true },
        error_message: { type: Sequelize.TEXT, allowNull: true },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE },
      });

      console.log("Created twilio_messages table");
    } else {
      console.log("twilio_messages table already exists, skipping creation");
    }

    // Add indexes only if they don't exist using try-catch
    const indexes = [
      { name: "twilio_messages_to", column: "to" },
      { name: "twilio_messages_from", column: "from" },
      { name: "twilio_messages_status", column: "status" },
      { name: "twilio_messages_direction", column: "direction" },
      { name: "twilio_messages_createdAt", column: "createdAt" },
    ];

    for (const index of indexes) {
      try {
        await queryInterface.addIndex("twilio_messages", [index.column], {
          name: index.name,
        });
        console.log(`Created index ${index.name}`);
      } catch (error: any) {
        if (
          error.name === "SequelizeDatabaseError" &&
          error.parent &&
          error.parent.code === "42P07"
        ) {
          console.log(`Index ${index.name} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("twilio_messages");
  },
};
