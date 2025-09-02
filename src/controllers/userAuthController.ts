// controllers/userAuthController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Counter from "../models/counterModel"; // Use Counter instead of User
import { userLoginSchema } from "../schemas/userSchema";

// Make sure user login returns proper role information
// controllers/userAuthController.ts - Update the userLogin function
export const userLogin = async (req: Request, res: Response) => {
  try {
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    const counter = await Counter.findOne({ where: { username } });

    if (
      !counter ||
      !bcrypt.compareSync(password, counter.password) ||
      (counter.role !== "user" && !counter.special) // Allow both user and special counters
    ) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: counter.id,
        username,
        role: counter.role,
        special: counter.special,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }
    );

    res.status(200).json({
      token,
      username: counter.username,
      role: counter.role,
      special: counter.special,
      createdAt: counter.createdAt,
    });
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const userRegister = async (req: Request, res: Response) => {
  try {
    const { error } = userLoginSchema.validate(req.body); // Reuse login schema for simplicity
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    const existingUser = await Counter.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const counter = await Counter.create({
      username,
      password: hashedPassword,
      role: "user", // Force user role for user dashboard
    });

    res.status(201).json({
      id: counter.id,
      username: counter.username,
      role: counter.role,
      createdAt: counter.createdAt,
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const userChangePassword = async (req: Request, res: Response) => {
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
    if (
      !counter ||
      !bcrypt.compareSync(currentPassword, counter.password) ||
      counter.role !== "user"
    ) {
      return res
        .status(401)
        .json({ message: "Invalid current password or role" });
    }

    counter.password = bcrypt.hashSync(newPassword, 10);
    await counter.save();

    res.status(200).json({
      message: "Password updated successfully",
      username: counter.username,
    });
  } catch (error) {
    console.error("Error in user change password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
