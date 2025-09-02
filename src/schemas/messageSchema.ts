import Joi from "joi";

export const messageSchema = Joi.object({
  message: Joi.string().required(),
});
