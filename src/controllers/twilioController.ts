import { Router, Request, Response } from "express";
import twilio from "twilio";

const router = Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const from = process.env.TWILIO_WHATSAPP_NUMBER!;
const templateSid = process.env.TWILIO_TEMPLATE_SID!; // ✅ now read from env
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const twilioClient = twilio(accountSid, authToken);

// -----------------------------
// Send single WhatsApp message
// -----------------------------
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { to, variables } = req.body;

    if (!to || !variables) {
      return res.status(400).json({ error: "Missing 'to' or 'variables'" });
    }

    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const statusCallback = `${baseUrl}/api/twilio/status`;

    const message = await twilioClient.messages.create({
      from,
      to: formattedTo,
      contentSid: templateSid, // ✅ correct template
      contentVariables: JSON.stringify(variables), // ✅ stringify once here
      statusCallback,
    });

    res.json({ message: "Message sent", sid: message.sid });
  } catch (err: any) {
    console.error("Send error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// Send bulk WhatsApp messages
// -----------------------------
router.post("/send-bulk", async (req: Request, res: Response) => {
  try {
    const { recipients, variables } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "Recipients required" });
    }

    const results = await Promise.all(
      recipients.map(async (to: string) => {
        try {
          const formattedTo = to.startsWith("whatsapp:")
            ? to
            : `whatsapp:${to}`;

          const statusCallback = `${baseUrl}/api/twilio/status`;

          const message = await twilioClient.messages.create({
            from,
            to: formattedTo,
            contentSid: templateSid,
            contentVariables: JSON.stringify(variables),
            statusCallback,
          });

          return { to, sid: message.sid, status: "sent" };
        } catch (error: any) {
          return { to, error: error.message, status: "failed" };
        }
      })
    );

    res.json({ results });
  } catch (err: any) {
    console.error("Bulk error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// Status webhook
// -----------------------------
router.post("/status", (req: Request, res: Response) => {
  console.log("Status webhook received:", req.body);
  res.sendStatus(200);
});

export default router;
