import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ["admin", "developer"],
    default: "developer", // optional default
    required: true,
  },
  refreshToken: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: true,
  },
  apiRequests: {
    count: {
      type: Number,
      default: 0,
    },
    lastResetTime: {
      type: Date,
      default: Date.now,
    },
  },
});

// Hash before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
