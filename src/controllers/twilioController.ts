import { Request, Response } from "express";
import twilioClient from "../config/twilio";
import TwilioMessage from "../models/twilioMessageModel";
import { Op, fn, col, WhereOptions } from "sequelize";
import { messageSchema, bulkMessageSchema } from "../schemas/twilioSchema";

// ✅ Single message (handles free-form & template) - UPDATED WITH STATUS CALLBACK
export const sendSingleMessage = async (req: Request, res: Response) => {
  try {
    const { to, body, variables } = req.body;

    const from = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!from) {
      return res
        .status(500)
        .json({ message: "Twilio WhatsApp number not set" });
    }

    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    // Get your server's base URL for webhook
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const statusCallback = `${baseUrl}/api/twilio/webhook`;

    let message;
    if (variables && Object.keys(variables).length > 0) {
      // Use template message
      message = await twilioClient.messages.create({
        from,
        to: formattedTo,
        contentSid: "HXb095502f5db7560846e70f5ca5c4c7d9", // your template SID
        contentVariables: JSON.stringify(variables),
        statusCallback: statusCallback, // ADDED STATUS CALLBACK
      });
    } else {
      // Use free-form body message
      if (!body) {
        return res.status(400).json({
          message: "Body is required when variables are not provided",
        });
      }
      message = await twilioClient.messages.create({
        from,
        to: formattedTo,
        body,
        statusCallback: statusCallback, // ADDED STATUS CALLBACK
      });
    }

    // Save in DB
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

    res.status(201).json({
      message: "Message sent successfully",
      data: {
        sid: message.sid,
        to: message.to,
        from: message.from,
        status: message.status,
        note: "Status will update via webhook. Check message later for delivery status.",
      },
    });
  } catch (error: any) {
    console.error("Twilio error:", error);
    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};

// ✅ Bulk messages (supports both template & body) - UPDATED WITH STATUS CALLBACK
export const sendBulkMessages = async (req: Request, res: Response) => {
  try {
    const { error } = bulkMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((err) => err.message),
      });
    }

    const { recipients, body, variables } = req.body;

    const from = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!from) {
      console.error("TWILIO_WHATSAPP_NUMBER environment variable is not set");
      return res.status(500).json({
        message: "Server configuration error",
        error: "Twilio WhatsApp number is not configured",
      });
    }

    // Get your server's base URL for webhook
    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const statusCallback = `${baseUrl}/api/twilio/webhook`;

    const results = await Promise.allSettled(
      recipients.map(async (to: string) => {
        const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

        try {
          let message;
          if (variables && Object.keys(variables).length > 0) {
            message = await twilioClient.messages.create({
              from,
              to: formattedTo,
              contentSid: "HXb095502f5db7560846e70f5ca5c4c7d9", // your template SID
              contentVariables: JSON.stringify(variables),
              statusCallback: statusCallback, // ADDED STATUS CALLBACK
            });
          } else {
            message = await twilioClient.messages.create({
              body,
              from,
              to: formattedTo,
              statusCallback: statusCallback, // ADDED STATUS CALLBACK
            });
          }

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

// ✅ IMPROVED WEBHOOK HANDLER
export const handleTwilioWebhook = async (req: Request, res: Response) => {
  try {
    console.log("📨 Twilio Webhook Received:", req.body);

    const {
      MessageSid,
      MessageStatus,
      To,
      From,
      ErrorCode,
      ErrorMessage,
      SmsSid,
      SmsStatus,
    } = req.body;

    // Use either MessageSid (WhatsApp) or SmsSid (SMS)
    const messageSid = MessageSid || SmsSid;
    const messageStatus = MessageStatus || SmsStatus;

    if (messageSid) {
      const errorCodeString = ErrorCode ? ErrorCode.toString() : null;

      const [updatedCount] = await TwilioMessage.update(
        {
          status: messageStatus,
          error_code: errorCodeString,
          error_message: ErrorMessage,
          updatedAt: new Date(),
        },
        {
          where: {
            message_sid: messageSid,
          },
        }
      );

      if (updatedCount > 0) {
        console.log(
          `✅ Updated message ${messageSid} status to: ${messageStatus}`
        );
      } else {
        console.log(`⚠️ Message ${messageSid} not found in database`);

        // If message not found, create a new record for inbound messages
        if (messageStatus === "received") {
          await TwilioMessage.create({
            message_sid: messageSid,
            to: To,
            from: From,
            body: req.body.Body || "No content",
            status: messageStatus,
            direction: "inbound",
            error_code: errorCodeString,
            error_message: ErrorMessage,
          });
          console.log(`📥 Created inbound message record for ${messageSid}`);
        }
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.set("Content-Type", "text/xml");
    res
      .status(200)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error("❌ Error in handleTwilioWebhook:", error);
    res.set("Content-Type", "text/xml");
    res
      .status(500)
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
};

// ✅ NEW: Check message status from Twilio API
export const refreshMessageStatus = async (req: Request, res: Response) => {
  try {
    const { messageSid } = req.params;

    // Fetch current status from Twilio
    const message = await twilioClient.messages(messageSid).fetch();

    // Update database
    const [updatedCount] = await TwilioMessage.update(
      {
        status: message.status,
        error_code: message.errorCode ? message.errorCode.toString() : null,
        error_message: message.errorMessage,
        updatedAt: new Date(),
      },
      {
        where: {
          message_sid: messageSid,
        },
      }
    );

    if (updatedCount > 0) {
      res.json({
        message: "Status refreshed successfully",
        data: {
          sid: message.sid,
          status: message.status,
          error_code: message.errorCode,
          error_message: message.errorMessage,
        },
      });
    } else {
      res.status(404).json({ message: "Message not found in database" });
    }
  } catch (error: any) {
    console.error("Error refreshing message status:", error);
    res.status(500).json({
      message: "Failed to refresh message status",
      error: error.message,
    });
  }
};

// ✅ Rest of the functions remain the same...
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
        updatedAt: message.updatedAt,
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
