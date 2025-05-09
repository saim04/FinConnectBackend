import "./config.js";
import express from "express";
import cors from "cors";
import { connectDB } from "./db/connectDb.js";
import userRoutes from "./routes/User.router.js";
import accountRoutes from "./routes/Account.router.js";
import invoiceRoutes from "./routes/Invoice.router.js";
import adminRoutes from "./routes/Admin.router.js";
import cookieParser from "cookie-parser";
import stripeRoutes from "./routes/Subscription.router.js";
import { handleStripeWebhook } from "./controllers/Subscription.controllers.js";

connectDB();
const app = express();
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }), // raw parser here
  handleStripeWebhook
);

app.use(cookieParser());
const allowedOrigins = ["http://localhost:5173"];
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      console.log("Incoming request from origin:", origin);

      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// Routes
app.use("/api/user", userRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stripe", stripeRoutes);

// Routers
app.get("/", (req, res) => {
  res.send("Hello, Webkode API is working!");
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server listen", port);
});
