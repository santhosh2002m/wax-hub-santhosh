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
  vehicle_type: Joi.string().allow("", null).optional().default("N/A"),
  guide_name: Joi.string().allow("", null).optional().default("N/A"),
  guide_number: Joi.string().allow("", null).optional().default("N/A"),
  show_name: Joi.string().required().messages({
    "string.empty": "Show name is required",
  }),
  adults: Joi.number().integer().min(1).required().messages({
    "number.base": "Adults must be a number",
    "number.integer": "Adults must be an integer",
    "number.min": "At least 1 adult is required",
    "any.required": "Number of adults is required",
  }),
  ticket_price: Joi.number().min(0).required().messages({
    "number.base": "Ticket price must be a number",
    "number.min": "Ticket price cannot be negative",
    "any.required": "Ticket price is required",
  }),
  total_price: Joi.number().min(0).required().messages({
    "number.base": "Total price must be a number",
    "number.min": "Total price cannot be negative",
    "any.required": "Total price is required",
  }),
  tax: Joi.number().min(0).required().messages({
    "number.base": "Tax must be a number",
    "number.min": "Tax cannot be negative",
    "any.required": "Tax is required",
  }),
  final_amount: Joi.number().min(0).required().messages({
    "number.base": "Final amount must be a number",
    "number.min": "Final amount cannot be negative",
    "any.required": "Final amount is required",
  }),
});
