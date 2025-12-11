import Joi from "joi";

export const inviteEmployeeSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be valid",
    "any.required": "Email is required",
  }),

  role: Joi.string().valid("admin", "user").required().messages({
    "any.only": "Role must be 'admin' or 'user'",
    "any.required": "Role is required",
  }),

  level: Joi.number().integer().required().messages({
    "number.base": "Level must be a number",
    "any.required": "Level is required",
  }),
})
  // Custom validation για τα levels
  .custom((value, helpers) => {
    const { role, level } = value;

    // Roles:
    // admin → 1–5
    // user  → 1–3

    if (role === "admin" && (level < 1 || level > 5)) {
      return helpers.error("any.custom", {
        message: "Admin level must be between 1 and 5",
      });
    }

    if (role === "user" && (level < 1 || level > 3)) {
      return helpers.error("any.custom", {
        message: "User level must be between 1 and 3",
      });
    }

    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  });

export const promoteEmployeeSchema = Joi.object({
  role: Joi.string().valid("admin", "user").required().messages({
    "any.only": "Role must be 'admin' or 'user'",
    "any.required": "Role is required",
  }),

  level: Joi.number().integer().required().messages({
    "number.base": "Level must be a number",
    "number.integer": "Level must be an integer",
    "any.required": "Level is required",
  }),
})
  .custom((value, helpers) => {
    const { role, level } = value;

    if (role === "admin" && (level < 1 || level > 5)) {
      return helpers.error("any.custom", {
        message: "Admin level must be between 1 and 5",
      });
    }

    if (role === "user" && (level < 1 || level > 3)) {
      return helpers.error("any.custom", {
        message: "User level must be between 1 and 3",
      });
    }

    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  });

export const loginAdminSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be valid",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// Ο admin μπορεί να αλλάξει:
// - full_name (optional)
// - currentPassword (optional)
// - newPassword (optional)

export const editAdminSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^(?! )[A-Za-z\s]+(?<! )$/)
    .allow("", null) // <-- αυτό επιτρέπει κενό string ή null
    .optional()
    .messages({
      "string.min": "Full name must be at least 3 characters",
      "string.max": "Full name must be under 50 characters",
      "string.pattern.base":
        "Full name can only contain letters and spaces, and cannot start or end with a space",
    }),

  currentPassword: Joi.string().allow("", null).optional(),
  newPassword: Joi.string()
    .min(6)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/)
    .allow("", null)
    .optional()
    .messages({
      "string.min": "New password must be at least 6 characters",
      "string.pattern.base":
        "New password must include at least one letter, one number, and one special character",
    }),
})
  .custom((value, helpers) => {
    // Αν υπάρχει νέο password, πρέπει να υπάρχει και currentPassword
    if (
      value.newPassword &&
      value.newPassword !== "" &&
      !value.currentPassword
    ) {
      return helpers.error("any.custom", {
        message: "To change your password, you must provide currentPassword",
      });
    }
    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  });
