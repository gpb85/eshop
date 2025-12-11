import Joi from "joi";
const registerSchema = Joi.object({
  fullName: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^(?! )[A-Za-z\s]+(?<! )$/) // δεν ξεκινά ή τελειώνει με κενό
    .required()
    .messages({
      "string.min": "Name must have at least 3 characters",
      "string.max": "Name must have at most 50 characters",
      "string.pattern.base":
        "Name can only contain letters and spaces, and cannot start or end with a space",
      "any.required": "Name is required",
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
  full_name: Joi.string().min(3).max(50).optional().messages({
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must be under 50 characters",
  }),

  currentPassword: Joi.string().optional(),
  newPassword: Joi.string().min(6).optional().messages({
    "string.min": "New password must be at least 6 characters",
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
