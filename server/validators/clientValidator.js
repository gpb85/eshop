import Joi from "joi";

//register validation

export const registerClientSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.min": "Email must be correct.",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Min 6 characters ",
    "any.required": "Password is required",
  }),
  fullName: Joi.string().min(3).max(50).required().messages({
    "string.min": "Name has at least 3 characters",
    "any.required": "Name is required",
  }),
});

export const loginClientSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const editClientSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(3).max(50).required(),
});
