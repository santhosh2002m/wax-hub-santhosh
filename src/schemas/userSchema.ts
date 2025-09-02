import Joi from "joi";

export const userLoginSchema = Joi.object({
  username: Joi.string().required().messages({
    "string.empty": "Username is required",
    "any.required": "Username is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

export const userRegisterSchema = Joi.object({
  username: Joi.string().required().messages({
    "string.empty": "Username is required",
    "any.required": "Username is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("ticket_manager", "admin").optional().messages({
    "string.valid": "Role must be either 'ticket_manager' or 'admin'",
  }),
});

export const userTicketSchema = Joi.object({
  vehicle_type: Joi.string().allow("", null).optional().messages({
    "string.empty": "Vehicle type cannot be empty", // Won't trigger due to allow("")
  }),
  guide_name: Joi.string().allow("", null).optional().messages({
    "string.empty": "Guide name cannot be empty", // Won't trigger due to allow("")
  }),
  guide_number: Joi.string().allow("", null).optional().messages({
    "string.empty": "Guide number cannot be empty", // Won't trigger due to allow("")
  }),
  show_name: Joi.string().allow("", null).optional().messages({
    "string.empty": "Show name cannot be empty", // Won't trigger due to allow("")
  }),
  adults: Joi.number().integer().min(0).allow(null).optional().messages({
    "number.base": "Adults must be a number",
    "number.integer": "Adults must be an integer",
    "number.min": "Adults cannot be negative",
  }),
  ticket_price: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "Ticket price must be a number",
    "number.min": "Ticket price cannot be negative",
  }),
  total_price: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "Total price must be a number",
    "number.min": "Total price cannot be negative",
  }),
  tax: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "Tax must be a number",
    "number.min": "Tax cannot be negative",
  }),
  final_amount: Joi.number().min(0).allow(null).optional().messages({
    "number.base": "Final amount must be a number",
    "number.min": "Final amount cannot be negative",
  }),
});
