import { Router, Request, Response } from "express";
import twilio from "twilio";

const router = Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const from = process.env.TWILIO_WHATSAPP_NUMBER!;
const templateSid = process.env.TWILIO_TEMPLATE_SID!; // Make sure this is set
const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const twilioClient = twilio(accountSid, authToken);

// -----------------------------
// Send single WhatsApp message (USING TEMPLATE)
// -----------------------------
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { to, variables } = req.body;

    if (!to || !variables) {
      return res.status(400).json({ error: "Missing 'to' or 'variables'" });
    }

    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    console.log("=== SENDING WHATSAPP TEMPLATE MESSAGE ===");
    console.log("Business Number:", from);
    console.log("To:", formattedTo);
    console.log("Template SID:", templateSid);
    console.log("Variables:", variables);

    const message = await twilioClient.messages.create({
      from: from,
      to: formattedTo,
      contentSid: templateSid, // Use template, not free text
      contentVariables: JSON.stringify(variables),
    });

    console.log("✅ Template message sent. SID:", message.sid);

    res.json({
      message: "WhatsApp template message sent",
      sid: message.sid,
      status: message.status,
    });
  } catch (err: any) {
    console.error("Send error:", err.message);
    console.error("Error code:", err.code);
    res.status(500).json({ error: err.message });
  }
});

export default router;
