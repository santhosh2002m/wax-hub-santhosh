import dotenv from "dotenv";
import sequelize from "../config/database";
import { ensureProductionSchema } from "../utils/ensureProductionSchema";

dotenv.config();

async function main() {
  try {
    await ensureProductionSchema();
    console.log("Guide UID backfill completed");
  } catch (error) {
    console.error("Guide UID backfill failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
