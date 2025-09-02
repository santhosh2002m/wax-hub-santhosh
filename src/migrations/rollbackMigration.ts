import { join } from "path";
import { readdirSync } from "fs";
import sequelize from "../config/database";
import { DataTypes, QueryInterface } from "sequelize";

const migrationsDir = __dirname;

const runRollback = async () => {
  try {
    const files = readdirSync(migrationsDir)
      .filter(
        (f) =>
          (f.endsWith(".ts") || f.endsWith(".js")) &&
          f !== "run-migrations.ts" &&
          f !== "rollbackMigration.ts"
      )
      .sort()
      .reverse();

    for (const file of files) {
      console.log(`Rolling back migration: ${file}`);
      const migration = await import(join(migrationsDir, file));
      if (migration.down) {
        await migration.down(
          sequelize.getQueryInterface() as QueryInterface,
          DataTypes
        );
        console.log(`Migration ${file} rolled back successfully!`);
      } else {
        console.warn(`⚠️ No "down" function found in ${file}`);
      }
    }

    console.log("✅ All migrations rolled back!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during rollback:", err);
    process.exit(1);
  }
};

runRollback();
