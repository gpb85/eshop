import Joi from "joi";

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
