import express from "express";
import {
  checkBalance,
  depositMoney,
  createAccount,
  transferMoney,
  getAllTransaction,
  getTransactionsByUserId,
} from "../controllers/Account.cotroller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyActiveSubscription } from "../middlewares/subscription.middleware.js";
import { requestCounter } from "../middlewares/requestcount.middleware.js";

const router = express.Router();

// Apply middleware before the controller
router.post(
  "/check-balance",
  verifyToken,
  verifyActiveSubscription,
  requestCounter,
  checkBalance
);
router.post(
  "/deposit",
  verifyToken,
  verifyActiveSubscription,
  requestCounter,
  depositMoney
);
router.post("/create-account", verifyToken, createAccount);
router.post(
  "/transfer-money",
  verifyToken,
  verifyActiveSubscription,
  transferMoney
);
router.get(
  "/transaction",
  verifyToken,
  verifyActiveSubscription,
  requestCounter,
  getAllTransaction
);

router.get("/transactions/:userId", getTransactionsByUserId);

export default router;
