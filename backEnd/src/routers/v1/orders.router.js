import { Router } from "express";
import {
  createOrder,
  getOrders,
  confirmPayment,
  updateOrderStatus
} from "../../controllers/orders.controller.js";

const router = Router();

// CREATE ORDER
router.post("/", createOrder);

// GET ALL ORDERS
router.get("/", getOrders);

// MANUAL PAYMENT CONFIRMATION BY M-PESA RECEIPT
router.post("/confirm-payment", confirmPayment);

// UPDATE ORDER STATUS
router.patch("/:id", updateOrderStatus);

export default router;