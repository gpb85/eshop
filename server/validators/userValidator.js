import Joi from "joi";

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be valid",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$"
      )
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters, include at least one letter, one number, and one special character",
      "any.required": "Password is required",
    }),
});

export const editUserSchema = Joi.object({
  fullName: Joi.string().min(3).max(50).optional().messages({
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must be under 50 characters",
  }),

  currentPassword: Joi.string().optional(),

  newPassword: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$"
      )
    )
    .optional()
    .messages({
      "string.pattern.base":
        "New password must be at least 8 characters, include at least one uppercase letter, one number, and one special character",
    }),
})
  // CUSTOM RULE → Αν υπάρχει newPassword πρέπει να υπάρχει currentPassword
  .custom((value, helpers) => {
    if (value.newPassword && !value.currentPassword) {
      return helpers.error("any.custom", {
        message:
          "To change your password, you must provide currentPassword as well",
      });
    }
    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  });
