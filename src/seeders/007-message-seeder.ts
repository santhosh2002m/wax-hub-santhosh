// FILE: seeders/007-message-seeder.ts
import { QueryInterface } from "sequelize";

interface CounterResult {
  id: number;
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Clear existing data first
    await queryInterface.bulkDelete("messages", {});

    // Get counters
    const [counters] = (await queryInterface.sequelize.query(
      "SELECT id FROM counters;"
    )) as [CounterResult[], unknown];

    const messages = [];
    const messageTexts = [
      "Please ensure all tickets are properly logged",
      "Reminder: Daily report due by 6 PM",
      "New show schedule starting next week",
      "Special discount for group bookings this weekend",
      "System maintenance scheduled for tomorrow night",
    ];

    for (let i = 0; i < 15; i++) {
      const randomCounter =
        counters[Math.floor(Math.random() * counters.length)];
      const daysAgo = Math.floor(Math.random() * 10);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      messages.push({
        message: messageTexts[Math.floor(Math.random() * messageTexts.length)],
        counter_id: randomCounter.id,
        createdAt: createdAt,
        updatedAt: createdAt,
      });
    }

    await queryInterface.bulkInsert("messages", messages);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("messages", {});
  },
};
