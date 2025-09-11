import { QueryInterface } from "sequelize";

interface CounterResult {
  id: number;
}

interface Ticket {
  price: number;
  dropdown_name: string;
  show_name: string;
  counter_id: number;
  createdAt: Date;
  updatedAt: Date;
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Get counter IDs
    const [counters] = (await queryInterface.sequelize.query(
      "SELECT id FROM counters;"
    )) as [CounterResult[], unknown];

    const tickets: Ticket[] = [];
    const showNames = [
      "Wax Museum",
      "Combo",
      "Horror House",
      "40 Horror or Wax",
      "Combo, Wax Museum",
      "Horror House, Wax Museum",
      "50 Combo",
    ];
    const dropdownNames = ["Regular", "VIP", "Premium", "Standard"];

    // Generate exactly 7 tickets, one for each show name
    showNames.forEach((showName) => {
      const randomCounter =
        counters[Math.floor(Math.random() * counters.length)];
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - randomDaysAgo);

      tickets.push({
        price: Math.floor(Math.random() * 500) + 100,
        dropdown_name:
          dropdownNames[Math.floor(Math.random() * dropdownNames.length)],
        show_name: showName,
        counter_id: randomCounter.id,
        createdAt: createdAt,
        updatedAt: createdAt,
      });
    });

    await queryInterface.bulkInsert("tickets", tickets);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("tickets", {});
  },
};
