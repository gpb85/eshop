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
  fullName: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),

  currentPassword: Joi.string().min(6).optional(),
  newPassword: Joi.string().min(6).optional(),
})
  .or("fullName", "email", "newPassword") // πρέπει τουλάχιστον ένα πεδίο να αλλάζει
  .with("newPassword", "currentPassword") // αν υπάρχει newPassword, πρέπει να υπάρχει και currentPassword
  .messages({
    "object.missing": "You must provide at least one field to update",
  });
