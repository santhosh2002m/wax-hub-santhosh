import sequelize from "../config/database";

async function clearDB() {
  try {
    await sequelize.query("DELETE FROM transactions");
    await sequelize.query("DELETE FROM user_tickets");
    await sequelize.query("DELETE FROM special_tickets");
    
    // Also reset the counters so it starts back at 0
    await sequelize.query("UPDATE invoice_counters SET last_user_invoice = 0, last_special_invoice = 0, has_reset_occurred = false");
    
    console.log("Successfully cleared all ticket history and reset counters to 0!");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing DB:", error);
    process.exit(1);
  }
}

clearDB();
