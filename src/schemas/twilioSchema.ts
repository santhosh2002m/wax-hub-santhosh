import Joi from "joi";

export const messageSchema = Joi.object({
  to: Joi.string()
    .pattern(/^(\+[1-9]\d{1,14}|whatsapp:\+\d{1,15})$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be in E.164 format (e.g., +1234567890) or WhatsApp format (e.g., whatsapp:+1234567890)",
      "any.required": "Recipient phone number is required",
    }),
  body: Joi.string().min(1).max(1600).required().messages({
    "string.empty": "Message body cannot be empty",
    "string.max": "Message cannot exceed 1600 characters",
    "any.required": "Message body is required",
  }),
});

export const bulkMessageSchema = Joi.object({
  recipients: Joi.array()
    .items(
      Joi.string()
        .pattern(/^(\+[1-9]\d{1,14}|whatsapp:\+\d{1,15})$/)
        .required()
    )
    .min(1)
    .max(1000)
    .required()
    .messages({
      "array.min": "At least one recipient is required",
      "array.max": "Cannot send to more than 1000 recipients at once",
      "any.required": "Recipients array is required",
    }),
  body: Joi.string().min(1).max(1600).required().messages({
    "string.empty": "Message body cannot be empty",
    "string.max": "Message cannot exceed 1600 characters",
    "any.required": "Message body is required",
  }),
});
