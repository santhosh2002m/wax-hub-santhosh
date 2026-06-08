/**
 * @deprecated Use `npm run seed:system` or admin Add Counter UI.
 * Creates a single counter user when COUNTER_USERNAME and COUNTER_PASSWORD are set.
 */
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";
import Counter from "../models/counterModel";

dotenv.config();

async function createUser() {
  const username = process.env.COUNTER_USERNAME;
  const password = process.env.COUNTER_PASSWORD;
  const role = (process.env.COUNTER_ROLE as "user" | "manager" | "admin") || "user";

  if (!username || !password) {
    console.error("Set COUNTER_USERNAME and COUNTER_PASSWORD env vars");
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    const existing = await Counter.findOne({ where: { username } });
    if (existing) {
      console.log(`User "${username}" already exists.`);
      process.exit(0);
    }

    await Counter.create({
      username,
      password: bcrypt.hashSync(password, 10),
      role,
      special: false,
    });
    console.log(`User "${username}" created successfully.`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createUser();
