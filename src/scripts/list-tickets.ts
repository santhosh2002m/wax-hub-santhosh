import sequelize from "../config/database";

async function listTickets() {
  try {
    const [transactions] = await sequelize.query("SELECT * FROM transactions");
    const [userTickets] = await sequelize.query("SELECT * FROM user_tickets");
    
    console.log("Transactions:");
    console.table(transactions);
    
    console.log("User Tickets:");
    console.table(userTickets);
    
    process.exit(0);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    process.exit(1);
  }
}

listTickets();
