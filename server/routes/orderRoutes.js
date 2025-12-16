import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "./../middleware/roleMiddleware.js";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getOrderById,
} from "./../controllers/orderControllers.js";

const router = express.Router();

router.post(
  "/order",
  authMiddleware,
  roleMiddleware("createOrder"),
  createOrder,
  cancelOrder
);

router.get(
  "/orders",
  authMiddleware,
  roleMiddleware("viewOwnOrders"),
  getAllOrders
);

router.get(
  "/orders/:id",
  authMiddleware,
  roleMiddleware("cancelOrders"),
  getOrderById
);

router.delete(
  "/orders/:id",
  authMiddleware,

  cancelOrder
);

export default router;
