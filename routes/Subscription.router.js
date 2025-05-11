import express from "express";
import {
  cancelSubscription,
  createCheckoutSession,
  getSubscription,
  updateSubscriptionPlan,
} from "../controllers/Subscription.controllers.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyAdminRole } from "../middlewares/role.middleware.js";
import { verifyActiveSubscription } from "../middlewares/subscription.middleware.js";

const router = express.Router();

// Route to create a checkout session
router.post("/create-checkout-session", verifyToken, createCheckoutSession);

router.post(
  "/cancel-subscription",
  verifyToken,
  verifyAdminRole,
  cancelSubscription
);

router.post(
  "/update-subscription",
  verifyToken,
  verifyActiveSubscription,
  updateSubscriptionPlan
);
router.get("/subscription", verifyToken, getSubscription);
export default router;
