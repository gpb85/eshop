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

const router = express.Router();

// Get all products
router.get("/products", getProducts);

// Get product by ID
router.get("/products/:id", getProductById);

// Add product
router.post(
  "/products",
  authMiddleware,
  validate(addProductSchema),
  addProduct
);

// Edit product (PATCH)
router.patch(
  "/products/:id",
  authMiddleware,
  validate(editProductSchema),
  editProduct
);

// Delete product
router.delete("/products/:id", authMiddleware, deleteProduct);

export default router;
