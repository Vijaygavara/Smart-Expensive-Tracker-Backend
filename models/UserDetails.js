import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    sessionId: {
      type: String,
      default: null,
    },
     otp: {
      type: String,
      default: null,
    },

    otpExpiresAt: {
      type: Date,
      default: null,
    },
     forgotPasswordOtp: {
    type: String,
    default: null,
  },

  forgotPasswordOtpExpiresAt: {
    type: Date,
    default: null,
  },

  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;