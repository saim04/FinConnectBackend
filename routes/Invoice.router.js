import express from "express";
import {
  generateInvoice,
  getInvoices,
} from "../controllers/Invoice.controllers.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyActiveSubscription } from "../middlewares/subscription.middleware.js";
import { requestCounter } from "../middlewares/requestcount.middleware.js";

const router = express.Router();

// Apply middleware before the controller
router.post(
  "/generate-invoice",
  verifyToken,
  verifyActiveSubscription,
  requestCounter,
  generateInvoice
);
router.get(
  "/get-invoice",
  verifyToken,
  verifyActiveSubscription,
  requestCounter,
  getInvoices
);

export default router;
