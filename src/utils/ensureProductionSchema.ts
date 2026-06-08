import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import sequelize from "../config/database";

dotenv.config();

function createDbConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  return new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl:
        process.env.NODE_ENV === "production"
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  });
}

async function addColumnIfMissing(
  db: Sequelize,
  table: string,
  column: string,
  definition: string
) {
  await db.query(`
    DO $$ BEGIN
      ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition};
    EXCEPTION
      WHEN duplicate_column THEN NULL;
    END $$;
  `);
}

async function commissionRoleExists(db: Sequelize): Promise<boolean> {
  const [rows] = await db.query(`
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'enum_counters_role'
      AND e.enumlabel = 'commission'
    LIMIT 1;
  `);

  return (rows as unknown[]).length > 0;
}

export async function ensureCommissionRole() {
  const db = createDbConnection();

  try {
    await db.authenticate();

    if (await commissionRoleExists(db)) {
      console.log('Role "commission" already exists in enum_counters_role');
      return;
    }

    try {
      await db.query(
        `ALTER TYPE "enum_counters_role" ADD VALUE IF NOT EXISTS 'commission';`
      );
    } catch {
      await db.query(`ALTER TYPE "enum_counters_role" ADD VALUE 'commission';`);
    }

    if (!(await commissionRoleExists(db))) {
      throw new Error(
        'Failed to add "commission" to enum_counters_role. Run manually: ALTER TYPE "enum_counters_role" ADD VALUE \'commission\';'
      );
    }

    console.log('Role "commission" added to enum_counters_role');
  } finally {
    await db.close();
  }
}

async function ensureColumns() {
  await addColumnIfMissing(
    sequelize,
    "user_tickets",
    "commission_paid",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumnIfMissing(
    sequelize,
    "user_tickets",
    "commission_paid_at",
    "TIMESTAMP WITH TIME ZONE"
  );
  await addColumnIfMissing(
    sequelize,
    "special_tickets",
    "commission_paid",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumnIfMissing(
    sequelize,
    "special_tickets",
    "commission_paid_at",
    "TIMESTAMP WITH TIME ZONE"
  );
  await addColumnIfMissing(sequelize, "user_guides", "uid", "VARCHAR(10)");
}

export async function ensureProductionSchema() {
  await ensureCommissionRole();
  await sequelize.authenticate();
  await ensureColumns();
  console.log("Production schema checks completed");
}
