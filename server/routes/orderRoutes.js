import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "./../middleware/roleMiddleware.js";
import {
  getOrders,
  gerOrderById,
  cancelOrder,
  createOrder,
} from "./../controllers/orderControllers.js";

const router = express.Router();

router.get("/orders", authMiddleware, roleMiddleware("orders"), getOrders);
router.get(
  "/orders/:id",
  authMiddleware,
  roleMiddleware("orders"),
  gerOrderById
);
router.post("/orders", authMiddleware, roleMiddleware("orders"), createOrder);
router.delete(
  "/orders/:id",
  authMiddleware,
  roleMiddleware("orders"),
  cancelOrder
);

export default router;
