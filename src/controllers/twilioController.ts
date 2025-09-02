import { Request, Response } from "express";
import twilioClient from "../config/twilio";
import TwilioMessage from "../models/twilioMessageModel";
import { Op, fn, col, WhereOptions } from "sequelize";
import { messageSchema, bulkMessageSchema } from "../schemas/twilioSchema";

export const sendSingleMessage = async (req: Request, res: Response) => {
  try {
    const { error } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((err) => err.message),
      });
    }

    const { to, body } = req.body;

    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    try {
      const message = await twilioClient.messages.create({
        body,
        from,
        to: formattedTo,
      });

      const savedMessage = await TwilioMessage.create({
        message_sid: message.sid,
        to: formattedTo,
        from: message.from,
        body: message.body,
        status: message.status,
        direction: "outbound-api",
        price: message.price,
        price_unit: message.priceUnit,
        error_code: message.errorCode ? message.errorCode.toString() : null,
        error_message: message.errorMessage,
      });

      res.status(201).json({
        message: "Message sent successfully",
        data: {
          sid: savedMessage.message_sid,
          to: savedMessage.to,
          from: savedMessage.from,
          body: savedMessage.body,
          status: savedMessage.status,
          price: savedMessage.price,
          price_unit: savedMessage.price_unit,
        },
      });
    } catch (twilioError: any) {
      console.error("Twilio error:", twilioError);

      await TwilioMessage.create({
        message_sid: `failed_${Date.now()}`,
        to: formattedTo,
        from,
        body,
        status: "failed",
        direction: "outbound-api",
        error_code: twilioError.code ? twilioError.code.toString() : null,
        error_message: twilioError.message,
      });

      return res.status(500).json({
        message: "Failed to send message",
        error: twilioError.message,
      });
    }
  } catch (error) {
    console.error("Error in sendSingleMessage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendBulkMessages = async (req: Request, res: Response) => {
  try {
    const { error } = bulkMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((err) => err.message),
      });
    }

    const { recipients, body } = req.body;
    const from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    const results = await Promise.allSettled(
      recipients.map(async (to: string) => {
        const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

        try {
          const message = await twilioClient.messages.create({
            body,
            from,
            to: formattedTo,
          });

          await TwilioMessage.create({
            message_sid: message.sid,
            to: formattedTo,
            from: message.from,
            body: message.body,
            status: message.status,
            direction: "outbound-api",
            price: message.price,
            price_unit: message.priceUnit,
            error_code: message.errorCode ? message.errorCode.toString() : null,
            error_message: message.errorMessage,
          });

          return {
            to: formattedTo,
            status: "success",
            sid: message.sid,
            error: null,
          };
        } catch (twilioError: any) {
          await TwilioMessage.create({
            message_sid: `failed_${Date.now()}_${formattedTo}`,
            to: formattedTo,
            from,
            body,
            status: "failed",
            direction: "outbound-api",
            error_code: twilioError.code ? twilioError.code.toString() : null,
            error_message: twilioError.message,
          });

          return {
            to: formattedTo,
            status: "failed",
            sid: null,
            error: twilioError.message,
          };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.status === "success"
    ).length;
    const failed = results.filter(
      (r) => r.status === "fulfilled" && r.value.status === "failed"
    ).length;

    res.status(200).json({
      message: `Bulk message sending completed`,
      summary: {
        total: recipients.length,
        successful,
        failed,
      },
      details: results.map((result, index) => ({
        recipient: recipients[index],
        status: result.status === "fulfilled" ? result.value.status : "failed",
        error:
          result.status === "fulfilled"
            ? result.value.error
            : "Promise rejected",
      })),
    });
  } catch (error) {
    console.error("Error in sendBulkMessages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      status,
      direction,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (direction) {
      whereClause.direction = direction;
    }

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
        { to: { [Op.iLike]: `%${search}%` } },
        { from: { [Op.iLike]: `%${search}%` } },
        { body: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: messages } = await TwilioMessage.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({
      messages: messages.map((message) => ({
        id: message.id,
        message_sid: message.message_sid,
        to: message.to,
        from: message.from,
        body: message.body,
        status: message.status,
        direction: message.direction,
        price: message.price,
        price_unit: message.price_unit,
        error_code: message.error_code,
        error_message: message.error_message,
        createdAt: message.createdAt,
      })),
      total: count,
      page: pageNum,
      pages: Math.ceil(count / limitNum),
    });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = await TwilioMessage.findByPk(id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({
      id: message.id,
      message_sid: message.message_sid,
      to: message.to,
      from: message.from,
      body: message.body,
      status: message.status,
      direction: message.direction,
      price: message.price,
      price_unit: message.price_unit,
      error_code: message.error_code,
      error_message: message.error_message,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    });
  } catch (error) {
    console.error("Error in getMessageById:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessageStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause: WhereOptions = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [
          new Date(startDate as string),
          new Date(endDate as string),
        ],
      };
    }

    const totalMessages = await TwilioMessage.count({ where: whereClause });
    const successfulMessages = await TwilioMessage.count({
      where: { ...whereClause, status: "delivered" },
    });
    const failedMessages = await TwilioMessage.count({
      where: { ...whereClause, status: "failed" },
    });
    const pendingMessages = await TwilioMessage.count({
      where: { ...whereClause, status: "queued" },
    });

    const statusCounts = await TwilioMessage.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      where: whereClause,
      group: ["status"],
      raw: true,
    });

    const dailyStats = await TwilioMessage.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: whereClause,
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    res.json({
      total: totalMessages,
      successful: successfulMessages,
      failed: failedMessages,
      pending: pendingMessages,
      success_rate:
        totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0,
      status_counts: statusCounts,
      daily_stats: dailyStats,
    });
  } catch (error) {
    console.error("Error in getMessageStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleTwilioWebhook = async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage } =
      req.body;

    if (MessageSid) {
      const errorCodeString = ErrorCode ? ErrorCode.toString() : null;

      await TwilioMessage.update(
        {
          status: MessageStatus,
          error_code: errorCodeString,
          error_message: ErrorMessage,
        },
        { where: { message_sid: MessageSid } }
      );
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error in handleTwilioWebhook:", error);
    res.status(500).send("Error");
  }
};
