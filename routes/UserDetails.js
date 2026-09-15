import express from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  verifyOtp,
  getProfile,
  resendOtp,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword
} from "../controllers/UserDetailsController.js";

import authMiddleware from "../middlewares/UserDetailsMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post(
  "/verify-forgot-password-otp",
  verifyForgotPasswordOtp
);
router.post("/logout",authMiddleware,logoutUser);

router.get(
  "/profile",
  authMiddleware,
  getProfile
);
  router.post("/reset-password", resetPassword);

export default router;