// FILE: seeders/001-counter-seeder.ts
import { QueryInterface } from "sequelize";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const devPassword = process.env.DEV_SEED_PASSWORD;
    if (!devPassword) {
      throw new Error(
        "DEV_SEED_PASSWORD env var is required for dev counter seeder"
      );
    }
    const hashedPassword = bcrypt.hashSync(devPassword, 10);

    // First, check if counters already exist and delete them
    await queryInterface.bulkDelete("counters", {});

    await queryInterface.bulkInsert("counters", [
      {
        username: "admin",
        password: hashedPassword,
        role: "admin",
        special: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "manager1",
        password: hashedPassword,
        role: "manager",
        special: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "user1",
        password: hashedPassword,
        role: "user",
        special: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "special_counter",
        password: hashedPassword,
        role: "user",
        special: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("counters", {});
  },
};
