// src/migrations/run-migrations.ts
import { join } from "path";
import { readdirSync } from "fs";
import sequelize from "../config/database";
import { DataTypes, QueryInterface } from "sequelize";

const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    const migrationsPath = join(__dirname);
    const files = readdirSync(migrationsPath)
      .filter(
        (f) =>
          f.endsWith(".ts") &&
          f !== "run-migrations.ts" &&
          f !== "rollbackMigration.ts"
      )
      .sort();

    for (const file of files) {
      try {
        const migration = await import(join(migrationsPath, file));
        console.log(`Running migration: ${file}`);
        await migration.up(
          sequelize.getQueryInterface() as QueryInterface,
          DataTypes
        );
      } catch (err) {
        console.error(`Migration error for ${file}:`, err);
        throw err; // Re-throw to stop on error
      }
    }

    console.log("All migrations completed!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
};

runMigrations().then(() => {
  process.exit(0);
});
