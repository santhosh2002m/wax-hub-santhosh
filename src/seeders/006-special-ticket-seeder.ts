// FILE: seeders/006-special-ticket-seeder.ts
import { QueryInterface } from "sequelize";

interface CounterResult {
  id: number;
}

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Clear existing data first
    await queryInterface.bulkDelete("special_tickets", {});

    // Get special counter
    const [specialCounter] = (await queryInterface.sequelize.query(
      "SELECT id FROM counters WHERE username = 'special_counter';"
    )) as [CounterResult[], unknown];

    const specialTickets = [];
    const guideNames = ["Special Guide 1", "Special Guide 2", "VIP Guide"];

    for (let i = 0; i < 10; i++) {
      const counter = specialCounter[0];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const adults = Math.floor(Math.random() * 5) + 1;
      const ticketPrice = 500; // Higher price for special tickets
      const totalPrice = adults * ticketPrice;
      const tax = totalPrice * 0.18;
      const finalAmount = totalPrice + tax;

      specialTickets.push({
        invoice_no: `SPT${1000 + i}`,
        vehicle_type: "Luxury Van",
        guide_name: guideNames[Math.floor(Math.random() * guideNames.length)],
        guide_number: `+91987655${4000 + i}`,
        show_name: "VIP Show",
        adults: adults,
        ticket_price: ticketPrice,
        total_price: totalPrice,
        tax: tax,
        final_amount: finalAmount,
        status: "completed",
        counter_id: counter.id,
        createdAt: createdAt,
        updatedAt: createdAt,
      });
    }

    await queryInterface.bulkInsert("special_tickets", specialTickets);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("special_tickets", {});
  },
};
