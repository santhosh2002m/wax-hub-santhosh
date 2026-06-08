import { Request, Response } from "express";
import { Op } from "sequelize";
import UserTicket from "../models/userticketModel";
import SpecialTicket from "../models/SpecialTicket";
import {
  buildGuideUidLookup,
  resolveGuideUid,
} from "../utils/resolveGuideUid";

const formatTicket = (
  ticket: UserTicket | SpecialTicket,
  ticketType: "normal" | "special",
  guideUid: string | null
) => ({
  id: ticket.id,
  ticket_type: ticketType,
  invoice_no: ticket.invoice_no,
  guide_uid: guideUid,
  guide_name: ticket.guide_name,
  guide_number: ticket.guide_number,
  vehicle_type: ticket.vehicle_type,
  show_name: ticket.show_name,
  adults: ticket.adults,
  final_amount: ticket.final_amount,
  status: ticket.status,
  createdAt: ticket.createdAt,
});

export const getCommissionTickets = async (req: Request, res: Response) => {
  try {
    const { search, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const baseWhere: any = { commission_paid: false };

    if (search) {
      baseWhere[Op.or] = [
        { guide_name: { [Op.iLike]: `%${search}%` } },
        { guide_number: { [Op.iLike]: `%${search}%` } },
        { invoice_no: { [Op.iLike]: `%${search}%` } },
        { vehicle_type: { [Op.iLike]: `%${search}%` } },
        { show_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const [normalTickets, specialTickets] = await Promise.all([
      UserTicket.findAll({
        where: baseWhere,
        order: [["createdAt", "DESC"]],
      }),
      SpecialTicket.findAll({
        where: baseWhere,
        order: [["createdAt", "DESC"]],
      }),
    ]);

    const guideLookup = await buildGuideUidLookup();

    const combined = [
      ...normalTickets.map((t) =>
        formatTicket(
          t,
          "normal",
          resolveGuideUid(guideLookup, t.guide_name, t.guide_number)
        )
      ),
      ...specialTickets.map((t) =>
        formatTicket(
          t,
          "special",
          resolveGuideUid(guideLookup, t.guide_name, t.guide_number)
        )
      ),
    ].sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );

    const total = combined.length;
    const offset = (pageNum - 1) * limitNum;
    const tickets = combined.slice(offset, offset + limitNum);

    res.json({
      tickets,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error("Error in getCommissionTickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markCommissionPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ticket_type } = req.body as { ticket_type: "normal" | "special" };

    if (!ticket_type || !["normal", "special"].includes(ticket_type)) {
      return res
        .status(400)
        .json({ message: "ticket_type must be 'normal' or 'special'" });
    }

    const ticketId = parseInt(id, 10);
    const paidAt = new Date();

    if (ticket_type === "normal") {
      const ticket = await UserTicket.findByPk(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      if (ticket.commission_paid) {
        return res.status(400).json({ message: "Commission already paid" });
      }
      await ticket.update({
        commission_paid: true,
        commission_paid_at: paidAt,
      });
    } else {
      const ticket = await SpecialTicket.findByPk(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      if (ticket.commission_paid) {
        return res.status(400).json({ message: "Commission already paid" });
      }
      await ticket.update({
        commission_paid: true,
        commission_paid_at: paidAt,
      });
    }

    res.json({ message: "Commission marked as paid" });
  } catch (error) {
    console.error("Error in markCommissionPaid:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
