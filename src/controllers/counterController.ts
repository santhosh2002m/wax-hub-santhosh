import { Request, Response } from "express";
import Counter from "../models/counterModel";
import Transaction from "../models/transactionModel";
import Message from "../models/messageModel";
import bcrypt from "bcryptjs";
import { counterSchema } from "../schemas/counterSchema";

export const addCounter = async (req: Request, res: Response) => {
  try {
    const { error } = counterSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { username, password, special, role } = req.body;

    const existingCounter = await Counter.findOne({ where: { username } });
    if (existingCounter) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const counter = await Counter.create({
      username,
      password: hashedPassword,
      role: role || "manager",
      special: special || false,
    });
    res.status(201).json({
      id: counter.id,
      username: counter.username,
      role: counter.role,
      special: counter.special,
      createdAt: counter.createdAt,
    });
  } catch (error) {
    console.error("Error in addCounter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCounter = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const counter = await Counter.findOne({ where: { username } });
    if (!counter) return res.status(404).json({ message: "Counter not found" });

    if (counter.username === "special_counter") {
      return res
        .status(403)
        .json({ message: "Cannot delete the special counter" });
    }

    // First delete associated messages instead of setting counter_id to null
    await Message.destroy({ where: { counter_id: counter.id } });

    // Set counter_id to null in transactions table
    await Transaction.update(
      { counter_id: null },
      { where: { counter_id: counter.id } }
    );

    await Counter.destroy({ where: { username } });
    res.json({ message: "Counter deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCounter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCounters = async (req: Request, res: Response) => {
  try {
    const counters = await Counter.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json(counters);
  } catch (error) {
    console.error("Error in getCounters:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { error } = counterSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { username, password, role, special } = req.body;

    const existingUser = await Counter.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const validRoles = ["admin", "manager", "user"];
    if (role && !validRoles.includes(role)) {
      return res
        .status(400)
        .json({ message: "Role must be 'admin', 'manager', or 'user'" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const counter = await Counter.create({
      username,
      password: hashedPassword,
      role: role || "manager",
      special: special || false,
    });

    res.status(201).json({
      message: `User created successfully (role: ${counter.role})`,
      username: counter.username,
      role: counter.role,
      special: counter.special,
      createdAt: counter.createdAt,
    });
  } catch (error) {
    console.error("Error in registerAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: number; username: string };
    const userId = user.id;

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }

    const counter = await Counter.findByPk(userId);
    if (!counter || !bcrypt.compareSync(currentPassword, counter.password)) {
      return res.status(401).json({ message: "Invalid current password" });
    }

    counter.password = bcrypt.hashSync(newPassword, 10);
    await counter.save();
    res.status(200).json({
      message: "Password updated successfully",
      username: counter.username,
      role: counter.role,
      createdAt: counter.createdAt,
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// FILE: controllers/counterController.ts
export const createSpecialCounter = async () => {
  try {
    const username = "special_counter";
    const password = "SpecialPass123!";
    const existingCounter = await Counter.findOne({ where: { username } });
    if (!existingCounter) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await Counter.create({
        username,
        password: hashedPassword,
        role: "manager", // Changed from "user" to "manager"
        special: true,
      });
      console.log("Special counter created with username: special_counter");
    }
  } catch (error) {
    console.error("Error creating special counter:", error);
  }
};
