// FILE: middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedUser {
  id: number;
  username: string;
  role: string;
  special?: boolean;
}

// Add this new authorization function
export const authorizeForGuides = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  // Allow regular users, managers, admins, and special users to access guides
  if (
    user.role === "user" ||
    user.role === "manager" ||
    user.role === "admin" ||
    user.special
  ) {
    return next();
  }
  return res.status(403).json({ message: "Access to guides denied" });
};

export const authorizeRegularUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  if (user.role === "user" && !user.special) {
    return next();
  }
  return res.status(403).json({ message: "Regular user access required" });
};

// Strict special user authorization (only special users)
export const authorizeSpecialUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  if (user.special) {
    return next();
  }
  return res.status(403).json({ message: "Special user access required" });
};

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthenticatedUser;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const authorizeManager = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  if (user.role === "manager" || user.role === "admin" || user.special) {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Manager, admin, or special counter access required" });
};

export const authorizeUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  // Allow only regular users (not special) or admins
  if ((user.role === "user" && !user.special) || user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "User or admin access required" });
};

export const authorizeAdminOrUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  if (user.role !== "admin" && user.role !== "user" && !user.special) {
    return res
      .status(403)
      .json({ message: "Admin, user, or special counter access required" });
  }
  next();
};

export const authorizeAdminOrManager = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  if (user.role === "admin" || user.role === "manager" || user.special) {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Admin, manager, or special counter access required" });
};

// NEW: Special counter authorization
export const authorizeSpecialCounter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user as AuthenticatedUser;
  if (user.special || user.role === "admin") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Special counter or admin access required" });
};
