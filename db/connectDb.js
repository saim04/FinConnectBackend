import mongoose from "mongoose";
import Subscription from "../models/Subscription.model.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGOOSE_ID}`);
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
  }
};
