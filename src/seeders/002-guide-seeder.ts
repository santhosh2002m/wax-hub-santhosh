import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("user_guides", [
      // CHANGED FROM "guides" TO "user_guides"
      {
        name: "Rajesh Kumar",
        number: "+919876543210",
        vehicle_type: "Car",
        score: 150,
        total_bookings: 15,
        rating: 4.5,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Suresh Patel",
        number: "+919876543211",
        vehicle_type: "Van",
        score: 200,
        total_bookings: 20,
        rating: 4.8,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Mohammed Ali",
        number: "+919876543212",
        vehicle_type: "Bus",
        score: 300,
        total_bookings: 30,
        rating: 4.9,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Anil Sharma",
        number: "+919876543213",
        vehicle_type: "Car",
        score: 80,
        total_bookings: 8,
        rating: 4.2,
        status: "inactive",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("user_guides", {}); // CHANGED FROM "guides" TO "user_guides"
  },
};
