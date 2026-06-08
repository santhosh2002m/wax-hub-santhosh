import sequelize from "../config/database";

async function addColumnIfMissing(
  table: string,
  column: string,
  definition: string
) {
  await sequelize.query(`
    DO $$ BEGIN
      ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition};
    EXCEPTION
      WHEN duplicate_column THEN NULL;
    END $$;
  `);
}

async function commissionRoleExists(): Promise<boolean> {
  const [rows] = await sequelize.query(`
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'enum_counters_role'
      AND e.enumlabel = 'commission'
    LIMIT 1;
  `);

  return (rows as unknown[]).length > 0;
}

async function ensureCommissionRole() {
  if (await commissionRoleExists()) {
    console.log('Role "commission" already exists in enum_counters_role');
    return;
  }

  try {
    await sequelize.query(
      `ALTER TYPE "enum_counters_role" ADD VALUE IF NOT EXISTS 'commission';`
    );
  } catch {
    await sequelize.query(
      `ALTER TYPE "enum_counters_role" ADD VALUE 'commission';`
    );
  }

  if (!(await commissionRoleExists())) {
    throw new Error(
      'Failed to add "commission" to enum_counters_role. Run manually: ALTER TYPE "enum_counters_role" ADD VALUE \'commission\';'
    );
  }

  console.log('Role "commission" added to enum_counters_role');
}

export async function ensureProductionSchema() {
  await ensureCommissionRole();

  await addColumnIfMissing(
    "user_tickets",
    "commission_paid",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumnIfMissing(
    "user_tickets",
    "commission_paid_at",
    "TIMESTAMP WITH TIME ZONE"
  );
  await addColumnIfMissing(
    "special_tickets",
    "commission_paid",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumnIfMissing(
    "special_tickets",
    "commission_paid_at",
    "TIMESTAMP WITH TIME ZONE"
  );

  await addColumnIfMissing("user_guides", "uid", "VARCHAR(10)");

  console.log("Production schema checks completed");
}
