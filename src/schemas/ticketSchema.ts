import Joi from "joi";

export const ticketCreateSchema = Joi.object({
  dropdown_name: Joi.string().required().messages({
    "string.empty": "Dropdown name is required",
  }),
  show_name: Joi.string().required().messages({
    "string.empty": "Show name is required",
  }),
  price: Joi.number().integer().min(0).required().messages({
    "number.base": "Price must be a number",
    "number.integer": "Price must be an integer",
    "number.min": "Price cannot be negative",
    "any.required": "Price is required",
  }),
});

export const ticketUpdateSchema = Joi.object({
  dropdown_name: Joi.string().optional(),
  show_name: Joi.string().optional(),
  price: Joi.number().integer().min(0).optional(),
}).min(1);
