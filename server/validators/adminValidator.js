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
