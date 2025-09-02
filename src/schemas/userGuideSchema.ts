import Joi from "joi";

export const userGuideSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  number: Joi.string().min(1).max(20).required(),
  vehicle_type: Joi.string().min(1).max(50).required(),
  score: Joi.number().integer().min(0).optional(),
  total_bookings: Joi.number().integer().min(0).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});

export const userGuideUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  number: Joi.string().min(1).max(20).optional(),
  vehicle_type: Joi.string().min(1).max(50).optional(),
  score: Joi.number().integer().min(0).optional(),
  total_bookings: Joi.number().integer().min(0).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  status: Joi.string().valid("active", "inactive").optional(),
}).min(1);
