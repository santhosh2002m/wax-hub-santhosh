/**
 * One-time fix for production DB missing commission role.
 * Run: npx ts-node src/scripts/fix-commission-enum.ts
 * Or after build: node dist/scripts/fix-commission-enum.js
 */
import dotenv from "dotenv";
import { ensureCommissionRole } from "../utils/ensureProductionSchema";
import sequelize from "../config/database";

dotenv.config();

async function main() {
  try {
    console.log("Fixing commission enum...");
    await ensureCommissionRole();
    console.log("Commission enum fix completed successfully");
  } catch (error) {
    console.error("Commission enum fix failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
