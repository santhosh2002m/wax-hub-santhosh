// FILE: controllers/analyticsController.ts
import { Request, Response } from "express";
import { Op, fn, col, WhereOptions } from "sequelize";
import Ticket from "../models/ticketModel";
import Transaction from "../models/transactionModel";
import Counter from "../models/counterModel";
import UserTicket from "../models/userticketModel";
import SpecialTicket from "../models/SpecialTicket";

interface AttractionResult {
  total: number;
  show_name: string;
  category: string;
}

const calculateGrowth = (current: number, previous: number) =>
  previous ? ((current - previous) / previous) * 100 : 0;

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const formatHour = (date: Date) => {
  const hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12} ${ampm}`;
};

const formatMonthDay = (date: Date) =>
  date.toLocaleString("en-US", { month: "short", day: "numeric" });

const formatISODate = (date: Date) => date.toISOString().split("T")[0];

const formatMonth = (date: Date) =>
  date.toLocaleString("en-US", { month: "short" });

const subtractDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const subtractYears = (date: Date, years: number) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
};

const startOfMonth = (date: Date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfMonth = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfYear = (date: Date) => {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfYear = (date: Date) => {
  const d = new Date(date);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
};

const includeCounter = {
  include: [{ model: Counter, as: "counter", attributes: [] }],
};

export const getTodayOverview = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subtractDays(now, 1));
    const todayEnd = endOfDay(now);
    const yesterdayEnd = endOfDay(subtractDays(now, 1));

    // For ticket counts and amounts, keep the is_analytics filter
    const whereClause: WhereOptions = {
      createdAt: { [Op.gte]: today, [Op.lte]: todayEnd },
      is_analytics: true, // Keep this for ticket counts
    };

    const yesterdayWhere: WhereOptions = {
      createdAt: { [Op.gte]: yesterday, [Op.lte]: yesterdayEnd },
      is_analytics: true, // Keep this for ticket counts
    };

    // For attractions/guide scores, use a separate where clause WITHOUT is_analytics filter
    const attractionsWhereClause: WhereOptions = {
      createdAt: { [Op.gte]: today, [Op.lte]: todayEnd },
      // NO is_analytics filter here - include ALL tickets
    };

    const todayTickets = await Ticket.count({
      where: whereClause, // With is_analytics filter
      ...includeCounter,
    });
    const yesterdayTickets = await Ticket.count({
      where: yesterdayWhere, // With is_analytics filter
      ...includeCounter,
    });
    const ticketGrowth = calculateGrowth(todayTickets, yesterdayTickets);

    const todayAmount =
      (await Ticket.sum("price", {
        where: whereClause, // With is_analytics filter
        ...includeCounter,
      })) || 0;
    const yesterdayAmount =
      (await Ticket.sum("price", {
        where: yesterdayWhere, // With is_analytics filter
        ...includeCounter,
      })) || 0;
    const amountGrowth = calculateGrowth(todayAmount, yesterdayAmount);

    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const activeVisitors = await Ticket.count({
      where: {
        createdAt: { [Op.gte]: oneHourAgo },
        is_analytics: true, // Keep filter for active visitors
      },
      ...includeCounter,
    });

    // For attractions, use the filter WITHOUT is_analytics to include ALL tickets
    const attractions = (await Ticket.findAll({
      attributes: [[fn("SUM", col("price")), "total"], "show_name"],
      group: ["show_name"],
      where: attractionsWhereClause, // NO is_analytics filter - include ALL tickets
      ...includeCounter,
      raw: true,
    })) as unknown as AttractionResult[];

    const hours = Array.from({ length: 24 }, (_, i) => {
      const hourDate = new Date(today);
      hourDate.setHours(i);
      return formatHour(hourDate);
    });
    const chartData = await Promise.all(
      hours.map(async (hour, i) => {
        const hourStart = new Date(today);
        hourStart.setHours(i, 0, 0, 0);
        const hourEnd = new Date(today);
        hourEnd.setHours(i + 1, 0, 0, 0);
        const count = await Ticket.count({
          where: {
            createdAt: { [Op.gte]: hourStart, [Op.lt]: hourEnd },
            is_analytics: true, // Keep filter for chart data
          },
          ...includeCounter,
        });
        return { time: hour, value: count };
      })
    );

    res.json({
      totalTickets: todayTickets,
      totalAmount: `₹${todayAmount}`,
      activeVisitors,
      revenueGrowth: amountGrowth.toFixed(2),
      ticketGrowth: ticketGrowth.toFixed(2),
      attractions, // This now includes ALL tickets (both admin and user)
      chartData,
    });
  } catch (error) {
    console.error("Error in getTodayOverview:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLast7Days = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const start = startOfDay(subtractDays(now, 6));
    const end = endOfDay(now);
    const previousStart = startOfDay(subtractDays(now, 13));
    const previousEnd = endOfDay(subtractDays(now, 7));

    // For ticket counts and amounts, keep the is_analytics filter
    const whereClause: WhereOptions = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      is_analytics: true,
    };
    const previousWhere: WhereOptions = {
      createdAt: { [Op.gte]: previousStart, [Op.lte]: previousEnd },
      is_analytics: true,
    };

    // For attractions, use a separate where clause WITHOUT is_analytics filter
    const attractionsWhereClause: WhereOptions = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // NO is_analytics filter here - include ALL tickets
    };

    const totalTickets = await Ticket.count({
      where: whereClause,
      ...includeCounter,
    });
    const previousTickets = await Ticket.count({
      where: previousWhere,
      ...includeCounter,
    });
    const ticketGrowth = calculateGrowth(totalTickets, previousTickets);

    const totalAmount =
      (await Ticket.sum("price", {
        where: whereClause,
        ...includeCounter,
      })) || 0;
    const previousAmount =
      (await Ticket.sum("price", {
        where: previousWhere,
        ...includeCounter,
      })) || 0;
    const amountGrowth = calculateGrowth(totalAmount, previousAmount);

    const days = Array.from({ length: 7 }, (_, i) => {
      const day = subtractDays(now, 6 - i);
      return formatMonthDay(day);
    });

    const chartData = await Promise.all(
      days.map(async (day, i) => {
        const dayStart = startOfDay(subtractDays(now, 6 - i));
        const dayEnd = endOfDay(dayStart);
        const count = await Ticket.count({
          where: {
            createdAt: { [Op.gte]: dayStart, [Op.lte]: dayEnd },
            is_analytics: true, // Keep filter for chart data
          },
          ...includeCounter,
        });
        return { time: day, value: count };
      })
    );

    // For attractions, use the filter WITHOUT is_analytics to include ALL tickets
    const attractions = (await Ticket.findAll({
      attributes: [[fn("SUM", col("price")), "total"], "show_name"],
      group: ["show_name"],
      where: attractionsWhereClause, // NO is_analytics filter - include ALL tickets
      ...includeCounter,
      raw: true,
    })) as unknown as AttractionResult[];

    res.json({
      totalTickets,
      totalAmount: `₹${totalAmount}`,
      ticketGrowth: ticketGrowth.toFixed(2),
      revenueGrowth: amountGrowth.toFixed(2),
      attractions, // This now includes ALL tickets (both admin and user)
      chartData,
    });
  } catch (error) {
    console.error("Error in getLast7Days:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLast30Days = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const start = startOfDay(subtractDays(now, 29));
    const end = endOfDay(now);
    const previousStart = startOfDay(subtractDays(now, 59));
    const previousEnd = endOfDay(subtractDays(now, 30));

    // For ticket counts and amounts, keep the is_analytics filter
    const whereClause: WhereOptions = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      is_analytics: true,
    };
    const previousWhere: WhereOptions = {
      createdAt: { [Op.gte]: previousStart, [Op.lte]: previousEnd },
      is_analytics: true,
    };

    // For attractions, use a separate where clause WITHOUT is_analytics filter
    const attractionsWhereClause: WhereOptions = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // NO is_analytics filter here - include ALL tickets
    };

    const totalTickets = await Ticket.count({
      where: whereClause,
      ...includeCounter,
    });
    const previousTickets = await Ticket.count({
      where: previousWhere,
      ...includeCounter,
    });
    const ticketGrowth = calculateGrowth(totalTickets, previousTickets);

    const totalAmount =
      (await Ticket.sum("price", {
        where: whereClause,
        ...includeCounter,
      })) || 0;
    const previousAmount =
      (await Ticket.sum("price", {
        where: previousWhere,
        ...includeCounter,
      })) || 0;
    const amountGrowth = calculateGrowth(totalAmount, previousAmount);

    const days = Array.from({ length: 30 }, (_, i) => {
      const day = subtractDays(now, 29 - i);
      return formatMonthDay(day);
    });

    const chartData = await Promise.all(
      days.map(async (day, i) => {
        const dayStart = startOfDay(subtractDays(now, 29 - i));
        const dayEnd = endOfDay(dayStart);
        const count = await Ticket.count({
          where: {
            createdAt: { [Op.gte]: dayStart, [Op.lte]: dayEnd },
            is_analytics: true, // Keep filter for chart data
          },
          ...includeCounter,
        });
        return { time: day, value: count };
      })
    );

    // For attractions, use the filter WITHOUT is_analytics to include ALL tickets
    const attractions = (await Ticket.findAll({
      attributes: [[fn("SUM", col("price")), "total"], "show_name"],
      group: ["show_name"],
      where: attractionsWhereClause, // NO is_analytics filter - include ALL tickets
      ...includeCounter,
      raw: true,
    })) as unknown as AttractionResult[];

    res.json({
      totalTickets,
      totalAmount: `₹${totalAmount}`,
      ticketGrowth: ticketGrowth.toFixed(2),
      revenueGrowth: amountGrowth.toFixed(2),
      attractions, // This now includes ALL tickets (both admin and user)
      chartData,
    });
  } catch (error) {
    console.error("Error in getLast30Days:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAnnualPerformance = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const start = startOfYear(now);
    const end = endOfYear(now);
    const previousStart = startOfYear(subtractYears(now, 1));
    const previousEnd = endOfYear(subtractYears(now, 1));

    // For ticket counts and amounts, keep the is_analytics filter
    const whereClause: WhereOptions = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      is_analytics: true,
    };
    const previousWhere: WhereOptions = {
      createdAt: { [Op.gte]: previousStart, [Op.lte]: previousEnd },
      is_analytics: true,
    };

    // For attractions, use a separate where clause WITHOUT is_analytics filter
    const attractionsWhereClause: WhereOptions = {
      createdAt: { [Op.gte]: start, [Op.lte]: end },
      // NO is_analytics filter here - include ALL tickets
    };

    const totalTickets = await Ticket.count({
      where: whereClause,
      ...includeCounter,
    });
    const previousTickets = await Ticket.count({
      where: previousWhere,
      ...includeCounter,
    });
    const ticketGrowth = calculateGrowth(totalTickets, previousTickets);

    const totalAmount =
      (await Ticket.sum("price", {
        where: whereClause,
        ...includeCounter,
      })) || 0;
    const previousAmount =
      (await Ticket.sum("price", {
        where: previousWhere,
        ...includeCounter,
      })) || 0;
    const amountGrowth = calculateGrowth(totalAmount, previousAmount);

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), i, 1);
      return formatMonth(month);
    });

    const chartData = await Promise.all(
      months.map(async (month, i) => {
        const monthStart = startOfMonth(new Date(now.getFullYear(), i, 1));
        const monthEnd = endOfMonth(monthStart);
        const count = await Ticket.count({
          where: {
            createdAt: { [Op.gte]: monthStart, [Op.lte]: monthEnd },
            is_analytics: true, // Keep filter for chart data
          },
          ...includeCounter,
        });
        return { time: month, value: count };
      })
    );

    // For attractions, use the filter WITHOUT is_analytics to include ALL tickets
    const attractions = (await Ticket.findAll({
      attributes: [[fn("SUM", col("price")), "total"], "show_name"],
      group: ["show_name"],
      where: attractionsWhereClause, // NO is_analytics filter - include ALL tickets
      ...includeCounter,
      raw: true,
    })) as unknown as AttractionResult[];

    res.json({
      totalTickets,
      totalAmount: `₹${totalAmount}`,
      ticketGrowth: ticketGrowth.toFixed(2),
      revenueGrowth: amountGrowth.toFixed(2),
      attractions, // This now includes ALL tickets (both admin and user)
      chartData,
    });
  } catch (error) {
    console.error("Error in getAnnualPerformance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCalendarView = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }

    // FIXED: Filter out special invoices (SPT prefix) for admin dashboard
    const whereClause: WhereOptions = {
      date: {
        [Op.gte]: new Date(startDate as string),
        [Op.lte]: new Date(endDate as string),
      },
      invoice_no: {
        [Op.notLike]: "SPT%", // Exclude special tickets
      },
    };

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: Ticket,
          as: "ticket",
        },
        { model: Counter, as: "counter", attributes: ["id", "username"] },
      ],
      order: [["date", "ASC"]],
    });

    const calendarData = await Promise.all(
      transactions.map(async (transaction: any) => {
        const ticketJson = transaction.ticket.toJSON();
        let additionalData = {};

        if (
          transaction.invoice_no.startsWith("TKT") ||
          transaction.invoice_no.startsWith("SPT")
        ) {
          const isSpecial = transaction.invoice_no.startsWith("SPT");
          const ticketDetails = isSpecial
            ? await SpecialTicket.findOne({
                where: { invoice_no: transaction.invoice_no },
              })
            : await UserTicket.findOne({
                where: { invoice_no: transaction.invoice_no },
              });

          if (ticketDetails) {
            additionalData = {
              vehicle_type: ticketDetails.vehicle_type,
              guide_name: ticketDetails.guide_name,
              guide_number: ticketDetails.guide_number,
              adults: ticketDetails.adults,
              ticket_price: ticketDetails.ticket_price,
              total_price: ticketDetails.total_price,
              tax: ticketDetails.tax,
              final_amount: ticketDetails.final_amount,
              status: ticketDetails.status,
            };
          }
        }

        return {
          date: formatISODate(transaction.date),
          ticket: {
            ...ticketJson,
            ...additionalData,
            invoice_no: transaction.invoice_no,
            adult_count: transaction.adult_count,
            child_count: transaction.child_count,
            category: transaction.category,
            total_paid: transaction.total_paid,
            counter: transaction.counter
              ? {
                  id: transaction.counter.id,
                  username: transaction.counter.username,
                }
              : null,
          },
        };
      })
    );

    // Group by date
    const groupedCalendarData: { [key: string]: any[] } = {};

    // Initialize all dates in the range with empty arrays
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dateKey = formatISODate(currentDate);
      groupedCalendarData[dateKey] = [];
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate with actual data
    calendarData.forEach((entry) => {
      const { date, ticket } = entry;
      if (!groupedCalendarData[date]) {
        groupedCalendarData[date] = [];
      }
      groupedCalendarData[date].push(ticket);
    });

    res.json({
      calendarData: groupedCalendarData,
      totalSales: calendarData.length,
      totalAmount: calendarData.reduce(
        (sum, entry) => sum + (entry.ticket.total_paid || 0),
        0
      ),
    });
  } catch (error) {
    console.error("Error in getCalendarView:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ... rest of the file (deleteCalendarTransaction and updateCalendarTransaction) remains the same
// NEW: Delete transaction and associated ticket
export const deleteCalendarTransaction = async (
  req: Request,
  res: Response
) => {
  try {
    const { invoice_no } = req.params;

    if (!invoice_no) {
      return res.status(400).json({ message: "Invoice number is required" });
    }

    // Find the transaction
    const transaction = await Transaction.findOne({
      where: { invoice_no },
      include: [{ model: Ticket, as: "ticket" }],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const ticketId = transaction.ticket_id;
    const isSpecial = invoice_no.startsWith("SPT");

    // Delete associated UserTicket or SpecialTicket if it exists
    if (invoice_no.startsWith("TKT") || invoice_no.startsWith("SPT")) {
      if (isSpecial) {
        await SpecialTicket.destroy({ where: { invoice_no } });
      } else {
        await UserTicket.destroy({ where: { invoice_no } });
      }
    }

    // Delete the transaction
    await Transaction.destroy({ where: { invoice_no } });

    // Delete the ticket
    await Ticket.destroy({ where: { id: ticketId } });

    res.json({
      message: "Transaction and associated ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteCalendarTransaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ... existing imports and code ...

// NEW: Update transaction and associated ticket
export const updateCalendarTransaction = async (
  req: Request,
  res: Response
) => {
  const transaction = await Transaction.sequelize!.transaction();

  try {
    const { invoice_no } = req.params;
    const updates = req.body;

    if (!invoice_no) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invoice number is required" });
    }

    // Find the transaction
    const transactionRecord = await Transaction.findOne({
      where: { invoice_no },
      include: [{ model: Ticket, as: "ticket" }],
      transaction,
    });

    if (!transactionRecord) {
      await transaction.rollback();
      return res.status(404).json({ message: "Transaction not found" });
    }

    const isSpecial = invoice_no.startsWith("SPT");

    // Update the transaction fields
    const transactionUpdates: any = {};

    if (updates.adult_count !== undefined) {
      transactionUpdates.adult_count = updates.adult_count;
    }

    if (updates.child_count !== undefined) {
      transactionUpdates.child_count = updates.child_count;
    }

    if (updates.category !== undefined) {
      transactionUpdates.category = updates.category;
    }

    if (updates.total_paid !== undefined) {
      transactionUpdates.total_paid = updates.total_paid;
    }

    if (updates.date !== undefined) {
      transactionUpdates.date = new Date(updates.date);
    }

    // Apply transaction updates if any
    if (Object.keys(transactionUpdates).length > 0) {
      await Transaction.update(transactionUpdates, {
        where: { invoice_no },
        transaction,
      });
    }

    // Update the associated ticket
    const ticketUpdates: any = {};
    if (updates.price !== undefined) {
      ticketUpdates.price = updates.price;
    }

    if (updates.ticket_type !== undefined) {
      ticketUpdates.ticket_type = updates.ticket_type;
    }

    if (updates.show_name !== undefined) {
      ticketUpdates.show_name = updates.show_name;
    }

    if (Object.keys(ticketUpdates).length > 0) {
      await Ticket.update(ticketUpdates, {
        where: { id: transactionRecord.ticket_id },
        transaction,
      });
    }

    // Update UserTicket or SpecialTicket if it exists
    if (invoice_no.startsWith("TKT") || invoice_no.startsWith("SPT")) {
      const userTicketUpdates: any = {};

      if (updates.vehicle_type !== undefined) {
        userTicketUpdates.vehicle_type = updates.vehicle_type;
      }

      if (updates.guide_name !== undefined) {
        userTicketUpdates.guide_name = updates.guide_name;
      }

      if (updates.guide_number !== undefined) {
        userTicketUpdates.guide_number = updates.guide_number;
      }

      if (updates.show_name !== undefined) {
        userTicketUpdates.show_name = updates.show_name;
      }

      if (updates.adults !== undefined) {
        userTicketUpdates.adults = updates.adults;
      }

      if (updates.ticket_price !== undefined) {
        userTicketUpdates.ticket_price = updates.ticket_price;
      }

      if (updates.total_price !== undefined) {
        userTicketUpdates.total_price = updates.total_price;
      }

      if (updates.tax !== undefined) {
        userTicketUpdates.tax = updates.tax;
      }

      if (updates.final_amount !== undefined) {
        userTicketUpdates.final_amount = updates.final_amount;
      }

      if (Object.keys(userTicketUpdates).length > 0) {
        if (isSpecial) {
          await SpecialTicket.update(userTicketUpdates, {
            where: { invoice_no },
            transaction,
          });
        } else {
          await UserTicket.update(userTicketUpdates, {
            where: { invoice_no },
            transaction,
          });
        }
      }
    }

    // Commit the transaction
    await transaction.commit();

    // Fetch the updated transaction with associations
    const updatedTransaction = await Transaction.findOne({
      where: { invoice_no },
      include: [
        { model: Ticket, as: "ticket" },
        { model: Counter, as: "counter", attributes: ["id", "username"] },
      ],
    });

    let userTicketData = {};
    if (invoice_no.startsWith("TKT") || invoice_no.startsWith("SPT")) {
      const userTicket = isSpecial
        ? await SpecialTicket.findOne({ where: { invoice_no } })
        : await UserTicket.findOne({ where: { invoice_no } });

      if (userTicket) {
        userTicketData = {
          vehicle_type: userTicket.vehicle_type,
          guide_name: userTicket.guide_name,
          guide_number: userTicket.guide_number,
          adults: userTicket.adults,
          ticket_price: userTicket.ticket_price,
          total_price: userTicket.total_price,
          tax: userTicket.tax,
          final_amount: userTicket.final_amount,
          status: userTicket.status,
        };
      }
    }

    // Create a properly typed response
    const responseData: any = {
      message: "Transaction updated successfully",
      transaction: {
        ...updatedTransaction?.toJSON(),
      },
    };

    // Add ticket data if it exists
    if (updatedTransaction && (updatedTransaction as any).ticket) {
      responseData.transaction.ticket = {
        ...(updatedTransaction as any).ticket.toJSON(),
        ...userTicketData,
      };
    }

    res.json(responseData);
  } catch (error) {
    await transaction.rollback();
    console.error("Error in updateCalendarTransaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
