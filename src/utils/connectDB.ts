import sequelize from "../config/database";

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully");

    // Sync models in development
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ force: false });
      console.log("Database synced");
    }
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
};
