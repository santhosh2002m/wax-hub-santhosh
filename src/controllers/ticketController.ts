// FILE: controllers/ticketController.ts
import { Request, Response } from "express";
import Ticket from "../models/ticketModel";
import Transaction from "../models/transactionModel";
import {
  ticketCreateSchema,
  ticketUpdateSchema,
} from "../schemas/ticketSchema";
import { Op } from "sequelize";

interface AuthenticatedUser {
  id: number;
  username: string;
  role: string;
}

export const getTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthenticatedUser;

    // Base where clause - exclude deleted tickets
    let whereClause: any = { deleted: false };

    // If user is admin, show ONLY admin-created tickets (is_analytics: false)
    if (user.role === "admin") {
      whereClause.is_analytics = false;
      const tickets = await Ticket.findAll({
        where: whereClause,
        attributes: [
          "id",
          "price",
          "dropdown_name",
          "show_name",
          "createdAt",
          "is_analytics",
          "counter_id",
          "deleted", // Include deleted field
        ],
        order: [["createdAt", "DESC"]],
      });
      return res.json(tickets);
    }

    // For non-admin users, show admin-created tickets and their own user-created tickets
    whereClause[Op.or] = [
      { is_analytics: false }, // Admin-created tickets
      { counter_id: user.id }, // Their own user-created tickets
    ];

    const tickets = await Ticket.findAll({
      where: whereClause,
      attributes: [
        "id",
        "price",
        "dropdown_name",
        "show_name",
        "createdAt",
        "is_analytics",
        "counter_id",
        "deleted", // Include deleted field
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(tickets);
  } catch (error) {
    console.error("Error in getTickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user as AuthenticatedUser;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    let whereClause: any = { id: ticketId, deleted: false }; // Exclude deleted tickets

    // If user is admin, restrict to admin-created tickets only
    if (user.role === "admin") {
      whereClause.is_analytics = false;
    } else {
      // For non-admin users, restrict access
      whereClause[Op.or] = [
        { is_analytics: false }, // Admin-created tickets
        { counter_id: user.id }, // Their own user-created tickets
      ];
    }

    const ticket = await Ticket.findOne({
      where: whereClause,
      attributes: [
        "id",
        "price",
        "dropdown_name",
        "show_name",
        "createdAt",
        "is_analytics",
        "counter_id",
        "deleted", // Include deleted field
      ],
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error in getTicketById:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addTicket = async (req: Request, res: Response) => {
  try {
    const { error } = ticketCreateSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((err) => err.message),
      });
    }

    const user = (req as any).user as AuthenticatedUser;
    const { dropdown_name, show_name, price } = req.body;

    const ticket = await Ticket.create({
      price: price,
      dropdown_name: dropdown_name,
      show_name: show_name,
      counter_id: user.id,
      is_analytics: false,
      deleted: false, // Set deleted to false by default
    } as any);

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: {
        id: ticket.id,
        price: ticket.price,
        dropdown_name: ticket.dropdown_name,
        show_name: ticket.show_name,
        is_analytics: ticket.is_analytics,
        counter_id: ticket.counter_id,
        deleted: ticket.deleted, // Include deleted field
        createdAt: ticket.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error in addTicket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = ticketUpdateSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((err) => err.message),
      });
    }

    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const user = (req as any).user as AuthenticatedUser;
    let whereClause: any = { id: ticketId, deleted: false }; // Only update non-deleted tickets

    // If user is not admin, restrict access to their own tickets or admin tickets
    if (user.role !== "admin") {
      whereClause[Op.or] = [
        { is_analytics: false }, // Can update admin-created tickets
        { counter_id: user.id }, // Can update their own user-created tickets
      ];
    }

    const ticket = await Ticket.findOne({
      where: whereClause,
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    await ticket.update(req.body);

    res.json({
      message: "Ticket updated successfully",
      ticket: {
        id: ticket.id,
        price: ticket.price,
        dropdown_name: ticket.dropdown_name,
        show_name: ticket.show_name,
        is_analytics: ticket.is_analytics,
        counter_id: ticket.counter_id,
        deleted: ticket.deleted, // Include deleted field
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in updateTicket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid ticket ID" });
    }

    const user = (req as any).user as AuthenticatedUser;
    let whereClause: any = { id: ticketId, deleted: false }; // Only soft delete non-deleted tickets

    // If user is not admin, restrict deletion to their own tickets
    if (user.role !== "admin") {
      whereClause.counter_id = user.id;
    }

    const ticket = await Ticket.findOne({
      where: whereClause,
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Soft delete - mark as deleted instead of actually deleting
    await ticket.update({ deleted: true });

    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error in deleteTicket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
