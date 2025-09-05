// FILE: controllers/specialTicketController.ts
import { Request, Response } from "express";
import SpecialTicket from "../models/SpecialTicket";
import { userTicketSchema } from "../schemas/userSchema";
import { Op } from "sequelize";
import Ticket from "../models/ticketModel";
import Transaction from "../models/transactionModel";
import Counter from "../models/counterModel";
import { v4 as uuidv4 } from "uuid";

interface AuthenticatedUser {
  id: number;
  username: string;
  role?: string;
  special?: boolean;
}

export const createSpecialTicket = async (req: Request, res: Response) => {
  try {
    const { error } = userTicketSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((err) => err.message),
      });
    }

    const user = (req as any).user as AuthenticatedUser;
    if (!user || !user.id) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const counter = await Counter.findByPk(user.id);
    if (!counter) {
      return res.status(404).json({ message: "Counter not found" });
    }

    // Allow special counters OR admins to create special tickets
    if (!counter.special && user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Special counter or admin required" });
    }

    const generateInvoiceNo = async (): Promise<string> => {
      return `SPT${uuidv4().slice(0, 8).toUpperCase()}`;
    };

    const invoice_no = await generateInvoiceNo();
    const ticketData: any = {
      ...req.body,
      invoice_no,
      counter_id: user.id,
      status: "completed" as const,
    };

    // FIX: Only create the SpecialTicket, DO NOT create admin dashboard Ticket
    const ticket = await SpecialTicket.create(ticketData);

    // FIX: Also skip creating Transaction record since it references the admin Ticket
    // await Transaction.create({
    //   invoice_no: ticket.invoice_no,
    //   date: new Date(),
    //   adult_count: ticketData.adults || 0,
    //   child_count: 0,
    //   category: "Special",
    //   total_paid: ticketData.final_amount || 0,
    //   ticket_id: adminTicket.id, // This would reference the admin ticket
    //   counter_id: user.id,
    // });

    res.status(201).json({
      message: "Special ticket created successfully",
      ticket: {
        id: ticket.id,
        invoice_no: ticket.invoice_no,
        vehicle_type: ticket.vehicle_type,
        guide_name: ticket.guide_name,
        guide_number: ticket.guide_number,
        show_name: ticket.show_name,
        adults: ticket.adults,
        ticket_price: ticket.ticket_price,
        total_price: ticket.total_price,
        tax: ticket.tax,
        final_amount: ticket.final_amount,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error in createSpecialTicket:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Failed to create ticket due to duplicate data",
        error: "Please try again with different details",
      });
    }
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error: " + error.errors[0].message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// FILE: controllers/specialTicketController.ts - ENHANCE getSpecialTickets function
export const getSpecialTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthenticatedUser;
    const counter = await Counter.findByPk(user.id);

    if (!counter) {
      return res.status(404).json({ message: "Counter not found" });
    }

    // FIX: Special users can only view their own tickets
    let whereClause: any = {};

    if (counter.special) {
      // Special user - only their own tickets
      whereClause.counter_id = user.id;
    } else if (user.role !== "admin" && user.role !== "manager") {
      // Regular users cannot access special tickets at all
      return res.status(403).json({
        message: "Access denied: Special counter, admin, or manager required",
      });
    }

    // ... rest of the function remains the same but uses the updated whereClause
    const { startDate, endDate, search, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get today's date range (only show today's tickets by default)
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    whereClause.createdAt = {
      [Op.between]: [startOfToday, endOfToday],
    };

    // If date range is provided (for admin viewing historical data)
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [
          new Date(startDate as string),
          new Date(endDate as string),
        ],
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { guide_name: { [Op.iLike]: `%${search}%` } },
        { guide_number: { [Op.iLike]: `%${search}%` } },
        { invoice_no: { [Op.iLike]: `%${search}%` } },
        { vehicle_type: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: tickets } = await SpecialTicket.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        invoice_no: ticket.invoice_no,
        vehicle_type: ticket.vehicle_type,
        guide_name: ticket.guide_name,
        guide_number: ticket.guide_number,
        show_name: ticket.show_name,
        adults: ticket.adults,
        ticket_price: ticket.ticket_price,
        total_price: ticket.total_price,
        tax: ticket.tax,
        final_amount: ticket.final_amount,
        status: ticket.status,
        createdAt: ticket.createdAt,
      })),
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum),
    });
  } catch (error) {
    console.error("Error in getSpecialTickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteSpecialTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user as AuthenticatedUser;

    const ticket = await SpecialTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: "Special ticket not found" });
    }

    // Check permissions: admin or the counter that created the ticket
    if (user.role !== "admin" && ticket.counter_id !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // FIX: Since we're not creating Transaction records anymore, just delete the special ticket
    await ticket.destroy();

    res.json({ message: "Special ticket deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSpecialTicket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
