import bcrypt from "bcryptjs";
import Counter from "../models/counterModel";
import sequelize from "../config/database";

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    const username = "admin";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const [counter, created] = await Counter.findOrCreate({
      where: { username },
      defaults: {
        username,
        password: hashedPassword,
        role: "admin",
        special: false,
      },
    });

    if (created) {
      console.log(`User '${username}' created successfully in counters table.`);
    } else {
      console.log(`User '${username}' already exists. Updating password and role.`);
      counter.password = hashedPassword;
      counter.role = "admin";
      await counter.save();
      console.log(`Admin user '${username}' updated successfully.`);
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await sequelize.close();
  }
}

createAdmin();
