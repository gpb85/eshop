import express from "express";
import {
  getProductById,
  getProducts,
  addProduct,
  editProduct,
  deleteProduct,
} from "./../controllers/productControllers.js";

import {
  addProductSchema,
  editProductSchema,
} from "./../validators/productValidator.js";
import { validate } from "./../middleware/validate.js";
import authMiddleware from "./../middleware/authMiddleware.js";
import roleMiddleware from "./../middleware/roleMiddleware.js";

const router = express.Router();

// Get all products
router.get("/products", getProducts);

// Get product by ID
router.get("/products/:id", getProductById);

// Add product
router.post(
  "/products",
  authMiddleware,
  roleMiddleware("products"),
  validate(addProductSchema),
  addProduct
);

// Edit product (PATCH)
router.patch(
  "/products/:id",
  authMiddleware,
  roleMiddleware("products"),
  validate(editProductSchema),
  editProduct
);

// Delete product
router.delete(
  "/products/:id",
  authMiddleware,
  roleMiddleware("products"),
  deleteProduct
);

export default router;
