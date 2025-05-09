import Subscription from "../models/Subscription.model.js";

export const verifyActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });
    console.log(userId);

    if (!subscription) {
      return res
        .status(403)
        .json({ message: "Access denied. No active subscription found." });
    }
    req.plan = subscription.plan;

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res
      .status(500)
      .json({ message: "Server error while checking subscription status." });
  }
};

const plans = [
  {
    id: "price_1RGTg2JvljWkaejrO0KzUhfR",
    name: "Basic",
  },
  {
    id: "price_1RGTh5JvljWkaejrRqfQ90TH",
    name: "Professional",
  },
  {
    id: "price_1RGTihJvljWkaejrc5tdgZwl",
    name: "Enterprise",
  },
];
