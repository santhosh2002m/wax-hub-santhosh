// ===== FILE: schemas/transactionSchema.ts =====
// src/schemas/transactionSchema.ts
import Joi from "joi";

export const transactionSchema = Joi.object({
  adult_count: Joi.number().integer().min(0).optional(),
  child_count: Joi.number().integer().min(0).optional(),
  category: Joi.string()
    .valid("Adult", "Child", "Senior", "Group", "Special", "Other")
    .optional(),
  total_paid: Joi.number().positive().optional(),
  show_name: Joi.string().optional(), // Allow updating show_name via ticket
  date: Joi.date().optional(),
  vehicle_type: Joi.string().optional(),
  guide_name: Joi.string().optional(),
  guide_number: Joi.string().optional(),
  adults: Joi.number().integer().min(0).optional(),
  ticket_price: Joi.number().min(0).optional(),
  total_price: Joi.number().min(0).optional(),
  tax: Joi.number().min(0).optional(),
  final_amount: Joi.number().min(0).optional(),
  price: Joi.number().min(0).optional(),
});

export const transactionUpdateSchema = Joi.object({
  adult_count: Joi.number().integer().min(0).optional(),
  child_count: Joi.number().integer().min(0).optional(),
  category: Joi.string()
    .valid("Adult", "Child", "Senior", "Group", "Special", "Other")
    .optional(),
  total_paid: Joi.number().positive().optional(),
  show_name: Joi.string().optional(),
  date: Joi.date().optional(),
  vehicle_type: Joi.string().optional(),
  guide_name: Joi.string().optional(),
  guide_number: Joi.string().optional(),
  adults: Joi.number().integer().min(0).optional(),
  ticket_price: Joi.number().min(0).optional(),
  total_price: Joi.number().min(0).optional(),
  tax: Joi.number().min(0).optional(),
  final_amount: Joi.number().min(0).optional(),
  price: Joi.number().min(0).optional(),
}).min(1);
