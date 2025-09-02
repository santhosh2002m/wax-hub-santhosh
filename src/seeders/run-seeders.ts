// FILE: seeders/run-seeders.ts (updated)
import { join } from "path";
import { readdirSync } from "fs";
import sequelize from "../config/database";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const runSeeders = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    const seedersPath = join(__dirname);
    const files = readdirSync(seedersPath)
      .filter(
        (f) =>
          f.endsWith(".ts") &&
          f !== "run-seeders.ts" &&
          f !== "reset-database.ts"
      ) // Exclude reset-database.ts
      .sort();

    for (const file of files) {
      try {
        const seeder = await import(join(seedersPath, file));
        console.log(`Running seeder: ${file}`);
        await seeder.up(sequelize.getQueryInterface());
        console.log(`✅ Seeder ${file} completed successfully`);
      } catch (err: any) {
        console.error(`❌ Seeder error for ${file}:`, err.message);
        if (err.name === "SequelizeUniqueConstraintError") {
          console.log("Skipping due to duplicate data...");
          continue; // Skip to next seeder
        }
        throw err;
      }
    }

    console.log("🎉 All seeders completed successfully!");
  } catch (err) {
    console.error("💥 Seeder error:", err);
    process.exit(1);
  }
};

runSeeders().then(() => {
  process.exit(0);
});
