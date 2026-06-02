import sequelize from "../config/database";
import bcrypt from "bcryptjs";

async function createUser() {
  try {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    const existingUser = await sequelize.query("SELECT * FROM counters WHERE username = 'user1'");
    
    if ((existingUser[0] as any[]).length === 0) {
      await sequelize.query(`
        INSERT INTO counters (username, password, role, special, "createdAt", "updatedAt") 
        VALUES ('user1', '${hashedPassword}', 'user', false, NOW(), NOW())
      `);
      console.log("User 'user1' created successfully!");
    } else {
      console.log("User 'user1' already exists.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  }
}

createUser();
