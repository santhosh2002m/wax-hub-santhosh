import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";
import Counter from "../models/counterModel";

dotenv.config();

type SystemUserConfig = {
  label: string;
  username?: string;
  password?: string;
  role: "admin" | "manager" | "user" | "commission";
  special: boolean;
};

const systemUsers: SystemUserConfig[] = [
  {
    label: "Admin",
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    role: "admin",
    special: false,
  },
  {
    label: "Commission",
    username: process.env.COMMISSION_USERNAME,
    password: process.env.COMMISSION_PASSWORD,
    role: "commission",
    special: false,
  },
  {
    label: "Special counter",
    username: process.env.SPECIAL_COUNTER_USERNAME,
    password: process.env.SPECIAL_COUNTER_PASSWORD,
    role: "manager",
    special: true,
  },
];

async function seedSystemUsers() {
  try {
    await sequelize.authenticate();
    console.log("Database connected for system user seeding");

    let seeded = 0;
    let skipped = 0;

    for (const user of systemUsers) {
      if (!user.username || !user.password) {
        console.log(
          `Skipping ${user.label}: set env vars before build/deploy (username + password required)`
        );
        skipped++;
        continue;
      }

      const existing = await Counter.findOne({
        where: { username: user.username },
      });

      const hashedPassword = bcrypt.hashSync(user.password, 10);

      if (existing) {
        console.log(`${user.label} user "${user.username}" already exists — skipped`);
        skipped++;
        continue;
      }

      await Counter.create({
        username: user.username,
        password: hashedPassword,
        role: user.role,
        special: user.special,
      });

      console.log(`${user.label} user "${user.username}" created`);
      seeded++;
    }

    console.log(
      `System user seeding finished (created: ${seeded}, skipped: ${skipped})`
    );
  } catch (error) {
    console.error("System user seeding failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedSystemUsers();
