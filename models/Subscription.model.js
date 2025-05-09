import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stripeCustomerId: {
    type: String,
    required: true,
    unique: true,
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "canceled", "past_due", "unpaid"],
    default: "active",
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  nextBillingDate: {
    type: Date,
  },
  trialEndDate: {
    type: Date,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

subscriptionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
