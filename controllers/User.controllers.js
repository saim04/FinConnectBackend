import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";
import cookieOptions from "../utils/cookieOptions.js";
import Subscription from "../models/Subscription.model.js";

export const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const newUser = await User.create({ fullName, email, password, role });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res
      .cookie("refreshToken", refreshToken, cookieOptions)
      .status(201)
      .json({
        message: "User registered successfully",
        accessToken,
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
        },
      });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
const PLAN_LIMITS = {
  price_1RGTg2JvljWkaejrO0KzUhfR: 20, // Basic
  price_1RGTh5JvljWkaejrRqfQ90TH: 50, // Professional
  price_1RGTihJvljWkaejrc5tdgZwl: 100, // Enterprise
};

const TIME_WINDOW = 5 * 60 * 1000; // 5 minutes
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Developer + Active Subscription request limit logic
    if (user.role === "developer") {
      const subscription = await Subscription.findOne({
        userId: user.id,
        status: "active",
      });

      if (subscription) {
        const plan = subscription.plan;
        const now = new Date();
        const lastResetTime = new Date(user.apiRequests.lastResetTime || now);
        const timeDiff = now - lastResetTime;
        const requestLimit = PLAN_LIMITS[plan] || 10;

        if (timeDiff >= TIME_WINDOW) {
          user.apiRequests.count = 0;
          user.apiRequests.lastResetTime = now;
        }

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

        await user.save(); // Save updated apiRequests
      }
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();
    const subscription = await Subscription.findOne({
      userId: user.id,
      status: "active",
    });
    const isSubscribed = Boolean(subscription);

    res
      .cookie("refreshToken", refreshToken, cookieOptions)
      .status(200)
      .json({
        message: "Login successful",
        accessToken,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isSubscribed: user.role === "admin" ? true : isSubscribed,
        },
      });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

//refresh token
export const refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  console.log(token);

  if (!token)
    return res.status(401).json({ message: "No refresh token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    console.log(token);
    console.log(user.refreshToken);

    if (!user || user.refreshToken !== token)
      return res
        .status(403)
        .json({ message: "Refresh token mismatch or expired" });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    // We will fetch subscriptions
    // isSubscribed = false;
    const subscription = await Subscription.findOne({
      userId: decoded.id,
      status: "active",
    });
    const isSubscribed = Boolean(subscription);
    res.cookie("refreshToken", newRefreshToken, cookieOptions).json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isSubscribed: user.role === "admin" ? true : isSubscribed,
      },
    });
  } catch (err) {
    res
      .status(403)
      .json({ message: "Invalid refresh token", error: err.message });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(204); // No content

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      user.refreshToken = "";
      await user.save();
    }

    res.clearCookie("refreshToken", { ...cookieOptions, maxAge: 0 });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.clearCookie("refreshToken", { ...cookieOptions, maxAge: 0 });
    res.status(403).json({ message: "Invalid token on logout" });
  }
};

// Admin Controllers
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();

    if (!users) {
      return res.status(404).json({ message: "No users found." });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error. Unable to fetch users." });
  }
};
