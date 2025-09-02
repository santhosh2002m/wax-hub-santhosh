// controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Counter from "../models/counterModel";
import { loginSchema } from "../schemas/authSchema";

// controllers/authController.ts - Update the login function
export const login = async (req: Request, res: Response) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, password } = req.body as {
      username: string;
      password: string;
    };
    const counter = await Counter.findOne({ where: { username } });
    if (!counter || !bcrypt.compareSync(password, counter.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (counter.role === "user" && !counter.special) {
      return res
        .status(403)
        .json({ message: "Use /api/user/auth/login for user dashboard" });
    }

    const token = jwt.sign(
      {
        id: counter.id,
        username,
        role: counter.role,
        special: counter.special,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" } // Increased timeout for better user experience
    );

    res.status(200).json({
      token,
      username: counter.username,
      role: counter.role,
      createdAt: counter.createdAt,
      special: counter.special, // Make sure this is included
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const editProfile = async (req: Request, res: Response) => {
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
    console.error("Error in editProfile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
