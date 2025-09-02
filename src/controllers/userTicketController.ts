// FILE: controllers/userTicketController.ts
import { Request, Response } from "express";
import UserTicket from "../models/userticketModel";
import { userTicketSchema } from "../schemas/userSchema";
import { Op } from "sequelize";
import Ticket from "../models/ticketModel";
import Transaction from "../models/transactionModel";
import Counter from "../models/counterModel";
import UserGuide from "../models/userGuideModel";
import { v4 as uuidv4 } from "uuid";

interface AuthenticatedUser {
  id: number;
  username: string;
  role?: string;
}

// Helper function to calculate guide rating
const calculateGuideRating = (totalBookings: number): number => {
  if (totalBookings > 50) return 4.8;
  if (totalBookings > 20) return 4.5;
  if (totalBookings > 10) return 4.2;
  return 4.0;
};

// Helper function to update guide stats or create guide if not exists
const updateGuideStats = async (
  guide_name: string,
  guide_number: string,
  vehicle_type: string,
  adults: number,
  transaction?: any
) => {
  try {
    // Add proper validation - allow empty strings but not null/undefined
    if (!guide_name || guide_name.trim() === "" || guide_name === "N/A") {
      console.log('Guide name is empty or "N/A", skipping guide update');
      return;
    }

    console.log(`Updating guide stats for: "${guide_name}", adults: ${adults}`);

    // Trim and normalize the guide name
    const normalizedGuideName = guide_name.trim();
    const normalizedGuideNumber = guide_number?.trim() || "N/A";
    const normalizedVehicleType = vehicle_type?.trim() || "Unknown";

    // First try to find guide by name (case-insensitive search)
    let guide = await UserGuide.findOne({
      where: {
        name: {
          [Op.iLike]: normalizedGuideName,
        },
      },
      transaction,
    });

    if (!guide) {
      console.log(`Creating new guide: "${normalizedGuideName}"`);
      // Create a new guide if it doesn't exist
      guide = await UserGuide.create(
        {
          name: normalizedGuideName,
          number: normalizedGuideNumber,
          vehicle_type: normalizedVehicleType,
          score: adults * 10,
          total_bookings: adults,
          rating: calculateGuideRating(adults),
          status: "active",
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction }
      );
      console.log(
        `Created new guide: "${normalizedGuideName}" with ID: ${guide.id}`
      );
    } else {
      console.log(
        `Found existing guide: "${normalizedGuideName}" (ID: ${guide.id})`
      );
      // Update existing guide's stats
      const newTotalBookings = (guide.total_bookings || 0) + adults;
      const newScore = (guide.score || 0) + adults * 10;

      await UserGuide.update(
        {
          total_bookings: newTotalBookings,
          score: newScore,
          rating: calculateGuideRating(newTotalBookings),
          updated_at: new Date(),
        },
        {
          where: { id: guide.id },
          transaction,
        }
      );

      console.log(
        `Updated guide: "${normalizedGuideName}", total bookings: ${newTotalBookings}, score: ${newScore}`
      );
    }
  } catch (error) {
    console.error("Error updating guide stats:", error);
    // Don't throw error here to avoid breaking ticket creation
  }
};

const generateUniqueInvoiceNo = async (
  prefix: string = "TKT"
): Promise<string> => {
  let invoiceNo: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    invoiceNo = `${prefix}${uuidv4().slice(0, 8).toUpperCase()}`;

    // Check if invoice number already exists
    const existingTicket = await UserTicket.findOne({
      where: { invoice_no: invoiceNo },
    });

    if (!existingTicket) {
      isUnique = true;
      return invoiceNo;
    }

    attempts++;
  }

  // Fallback: use timestamp if UUID collision occurs (extremely rare)
  return `${prefix}${Date.now().toString().slice(-8)}`;
};

export const createUserTicket = async (req: Request, res: Response) => {
  const transaction = await UserTicket.sequelize!.transaction();

  try {
    const { error } = userTicketSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((err) => err.message),
      });
    }

    const user = (req as any).user as AuthenticatedUser;
    if (!user || !user.id) {
      await transaction.rollback();
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const counter = await Counter.findByPk(user.id);
    if (!counter) {
      await transaction.rollback();
      return res.status(404).json({ message: "Counter not found" });
    }

    if (counter.special) {
      await transaction.rollback();
      return res
        .status(403)
        .json({ message: "Use special ticket route for special counters" });
    }

    // Generate unique invoice number
    const invoice_no = await generateUniqueInvoiceNo();

    const ticketData = {
      ...req.body,
      invoice_no,
      user_id: user.id,
      counter_id: user.id,
      status: "completed" as const,
    };

    // DEBUG: Log the incoming data
    console.log("Creating ticket with data:", {
      guide_name: ticketData.guide_name,
      guide_number: ticketData.guide_number,
      vehicle_type: ticketData.vehicle_type,
      adults: ticketData.adults,
      has_guide: !!ticketData.guide_name && ticketData.guide_name !== "N/A",
    });

    // Create all related records within a transaction
    const [ticket, adminTicket] = await Promise.all([
      UserTicket.create(ticketData, { transaction }),
      Ticket.create(
        {
          price: ticketData.final_amount,
          dropdown_name: ticketData.vehicle_type,
          show_name: ticketData.show_name,
          counter_id: user.id,
          is_analytics: true, // CRITICAL: This ensures user tickets appear in analytics
        },
        { transaction }
      ),
    ]);

    await Transaction.create(
      {
        invoice_no: ticket.invoice_no,
        date: new Date(),
        adult_count: ticket.adults,
        child_count: 0,
        category: "Group",
        total_paid: ticket.final_amount,
        ticket_id: adminTicket.id,
        counter_id: user.id,
      },
      { transaction }
    );

    // CRITICAL FIX: Update guide stats - this should happen AFTER ticket creation
    // Remove the validation check - let the updateGuideStats function handle validation
    if (ticketData.guide_name && ticketData.guide_name !== "N/A") {
      try {
        console.log(
          `Attempting to update guide stats for: ${ticketData.guide_name}`
        );
        await updateGuideStats(
          ticketData.guide_name,
          ticketData.guide_number || "N/A",
          ticketData.vehicle_type || "Unknown",
          ticketData.adults,
          transaction
        );
        console.log(
          `Guide stats updated successfully for: ${ticketData.guide_name}`
        );
      } catch (guideError) {
        console.error("Error updating guide stats:", guideError);
        // Don't rollback the entire transaction if guide update fails
        // The ticket creation should still succeed
      }
    } else {
      console.log("No guide name provided, skipping guide update");
    }

    // Commit the transaction
    await transaction.commit();

    res.status(201).json({
      message: "Ticket created successfully",
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
    // Rollback transaction on error
    await transaction.rollback();

    console.error("Error in createUserTicket:", error);

    // Handle specific database errors
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Failed to create ticket due to duplicate data",
        error: "Please try again with different details",
      });
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Invalid ticket data",
        error: error.errors[0].message,
      });
    }

    // Generic error response
    res.status(500).json({
      message: "Internal server error while creating ticket",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// FILE: controllers/userTicketController.ts (update getUserTickets function)
export const getUserTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as {
      id: number;
      username: string;
      role: string;
    };
    const { startDate, endDate, search, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get today's date range (only show today's tickets)
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    let whereClause: any = {
      user_id: user.id,
      createdAt: {
        [Op.between]: [startOfToday, endOfToday],
      },
    };

    // If admin provides date range, use it instead (for admin viewing)
    if (user.role === "admin" && startDate && endDate) {
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
      ];
    }

    const { count, rows: tickets } = await UserTicket.findAndCountAll({
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
    console.error("Error in getUserTickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUserTicket = async (req: Request, res: Response) => {
  const transaction = await UserTicket.sequelize!.transaction();

  try {
    const { id } = req.params;
    const user = (req as any).user as { id: number; role: string };
    const ticket = await UserTicket.findByPk(id);

    if (!ticket) {
      await transaction.rollback();
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (user.role !== "admin" && ticket.user_id !== user.id) {
      await transaction.rollback();
      return res.status(403).json({ message: "Access denied" });
    }

    // Find and delete related transaction and admin ticket
    const transactionRecord = await Transaction.findOne({
      where: { invoice_no: ticket.invoice_no },
    });

    if (transactionRecord) {
      // Delete the admin ticket first
      await Ticket.destroy({
        where: { id: transactionRecord.ticket_id },
        transaction,
      });

      // Then delete the transaction
      await Transaction.destroy({
        where: { invoice_no: ticket.invoice_no },
        transaction,
      });
    }

    // Finally delete the user ticket
    await ticket.destroy({ transaction });

    await transaction.commit();

    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in deleteUserTicket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
