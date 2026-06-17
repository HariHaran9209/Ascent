const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  verifyRegistration,
  login,
  verifyLoginOtp,
  resendOtp,
} = require("../controllers/authController");

const router = express.Router();

// Anyone hammering OTP-sending or OTP-checking endpoints gets throttled per IP.
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many OTP requests, please try again later" },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

router.post("/register", otpSendLimiter, register);
router.post("/verify-registration", otpVerifyLimiter, verifyRegistration);
router.post("/login", otpSendLimiter, login);
router.post("/verify-login-otp", otpVerifyLimiter, verifyLoginOtp);
router.post("/resend-otp", otpSendLimiter, resendOtp);

module.exports = router;
