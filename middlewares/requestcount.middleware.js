import User from "../models/User.model.js";

// Plan request limits (per 30 minutes)
const PLAN_LIMITS = {
  price_1RGTg2JvljWkaejrO0KzUhfR: 20, // Basic
  price_1RGTh5JvljWkaejrRqfQ90TH: 50, // Professional
  price_1RGTihJvljWkaejrc5tdgZwl: 100, // Enterprise
};
const TIME_WINDOW = 5 * 60 * 1000;

export const requestCounter = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const plan = req.plan;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. User not found." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    const now = new Date();
    const lastResetTime = new Date(user.apiRequests.lastResetTime);
    const timeDiff = now - lastResetTime;

    if (timeDiff >= TIME_WINDOW) {
      user.apiRequests.count = 0;
      user.apiRequests.lastResetTime = now;
      await user.save();
    }

    const requestLimit = PLAN_LIMITS[plan] || 10;

    if (user.apiRequests.count >= requestLimit) {
      const timeUntilReset = TIME_WINDOW - timeDiff;
      const minutesUntilReset = Math.ceil(timeUntilReset / (60 * 1000));

      return res.status(429).json({
        message: `Request limit exceeded for your subscription plan. Please try again in ${minutesUntilReset} minutes.`,
        currentCount: user.apiRequests.count,
        limit: requestLimit,
        plan: plan,
        nextResetIn: minutesUntilReset,
        nextResetTime: new Date(lastResetTime.getTime() + TIME_WINDOW),
      });
    }

    user.apiRequests.count += 1;
    await user.save();

    next();
  } catch (error) {
    console.error("Request counter middleware error:", error);
    res.status(500).json({
      message: "Server error while checking request limits.",
    });
  }
};
