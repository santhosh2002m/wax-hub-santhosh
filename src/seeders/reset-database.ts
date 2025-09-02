// FILE: seeders/reset-database.ts
import { join } from "path";
import { readdirSync } from "fs";
import sequelize from "../config/database";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const resetDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    // Drop all tables (be careful - this will delete all data!)
    await sequelize.drop();
    console.log("All tables dropped");

    // Recreate tables by syncing
    await sequelize.sync({ force: true });
    console.log("All tables recreated");

    console.log("✅ Database reset successfully!");
  } catch (err) {
    console.error("💥 Database reset error:", err);
    process.exit(1);
  }
};

resetDatabase().then(() => {
  process.exit(0);
});
