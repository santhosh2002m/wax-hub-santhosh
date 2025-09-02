// FILE: schemas/guideSchema.ts
import Joi from "joi";

export const guideSchema = Joi.object({
  name: Joi.string().required(),
  number: Joi.string().required(),
  vehicle_type: Joi.string().required(),
  score: Joi.number().integer().optional(),
  total_bookings: Joi.number().integer().optional(),
  rating: Joi.number().optional(),
  status: Joi.string().valid("active", "inactive").optional(),
});
