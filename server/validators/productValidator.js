import Joi from "joi";

export const addProductSchema = Joi.object({
  name: Joi.string().min(3).max(255).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must be at most 255 characters",
    "any.required": "Name is required",
  }),

  sku: Joi.string().min(3).max(100).optional().messages({
    "string.base": "SKU must be a string",
    "string.min": "SKU must be at least 3 characters",
    "string.max": "SKU must be at most 100 characters",
  }),

  category: Joi.string().min(2).max(50).optional().messages({
    "string.base": "Category must be a string",
    "string.min": "Category must be at least 2 characters",
    "string.max": "Category must be at most 50 characters",
  }),

  description: Joi.string().min(10).max(1000).required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description is required",
    "string.min": "Description must be at least 10 characters",
    "string.max": "Description must be at most 1000 characters",
    "any.required": "Description is required",
  }),

  price: Joi.number().precision(2).positive().required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be greater than 0",
    "any.required": "Price is required",
  }),

  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock must be a number",
    "number.integer": "Stock must be an integer",
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),
});

export const editProductSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional().messages({
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must be under 255 characters",
  }),
  sku: Joi.string().min(3).max(100).optional().messages({
    "string.min": "SKU must be at least 3 characters",
    "string.max": "SKU must be under 100 characters",
  }),
  description: Joi.string().min(10).optional().messages({
    "string.min": "Description must be at least 10 characters",
  }),
  price: Joi.number().precision(2).min(0).optional().messages({
    "number.min": "Price must be greater than or equal to 0",
    "number.base": "Price must be a number",
  }),
  stock: Joi.number().integer().min(0).optional().messages({
    "number.integer": "Stock must be an integer",
    "number.min": "Stock must be greater than or equal to 0",
  }),
  category: Joi.string().min(2).max(50).optional().messages({
    "string.min": "Category must be at least 2 characters",
    "string.max": "Category must be under 50 characters",
  }),
});
