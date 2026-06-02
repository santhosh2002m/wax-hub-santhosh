import sequelize from "../config/database";

async function listUsers() {
  try {
    const [results] = await sequelize.query("SELECT id, username, role, special FROM counters");
    console.log("Users in database:");
    console.table(results);
    process.exit(0);
  } catch (error) {
    console.error("Error fetching users:", error);
    process.exit(1);
  }
}

listUsers();
