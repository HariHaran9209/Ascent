const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/sendEmail");

const MAX_OTP_ATTEMPTS = 5;

function isExpired(date) {
  return !date || new Date(date).getTime() < Date.now();
}

async function issueOtp(user, purpose) {
  const otp = generateOtp();
  user.otp = {
    codeHash: await hashOtp(otp),
    purpose,
    expiresAt: getOtpExpiry(),
    attempts: 0,
  };
  await user.save();
  await sendOtpEmail({ to: user.email, otp, purpose, username: user.username });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are all required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ $or: [{ username }, { email: normalizedEmail }] });

    if (user && user.isVerified) {
      return res.status(409).json({ message: "Username or email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (user && !user.isVerified) {
      // Unverified account retrying signup — refresh credentials and resend OTP.
      user.username = username;
      user.email = normalizedEmail;
      user.passwordHash = passwordHash;
    } else {
      user = new User({ username, email: normalizedEmail, passwordHash });
    }

    await issueOtp(user, "register");

    return res.status(200).json({ message: "OTP sent to your email", email: user.email });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Username or email is already registered" });
    }
    console.error("register error:", err);
    return res.status(500).json({ message: "Something went wrong, please try again" });
  }
}

// POST /api/auth/verify-registration
async function verifyRegistration(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.isVerified || user.otp.purpose !== "register") {
      return res.status(400).json({ message: "Invalid or already-used verification request" });
    }

    if (isExpired(user.otp.expiresAt)) {
      return res.status(400).json({ message: "OTP expired, request a new one", expired: true });
    }
    if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: "Too many attempts, request a new OTP", expired: true });
    }

    const ok = await verifyOtp(otp, user.otp.codeHash);
    if (!ok) {
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    user.isVerified = true;
    user.otp = { codeHash: null, purpose: null, expiresAt: null, attempts: 0 };
    await user.save();

    const token = generateToken(user._id);
    return res.status(200).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    console.error("verifyRegistration error:", err);
    return res.status(500).json({ message: "Something went wrong, please try again" });
  }
}

// POST /api/auth/login  (step 1: password check, sends OTP)
async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        needsVerification: true,
        email: user.email,
      });
    }

    await issueOtp(user, "login");

    return res.status(200).json({ message: "OTP sent to your email", username: user.username });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Something went wrong, please try again" });
  }
}

// POST /api/auth/verify-login-otp  (step 2: OTP check, issues JWT)
async function verifyLoginOtp(req, res) {
  try {
    const { username, otp } = req.body;
    if (!username || !otp) {
      return res.status(400).json({ message: "Username and OTP are required" });
    }

    const user = await User.findOne({ username });
    if (!user || user.otp.purpose !== "login") {
      return res.status(400).json({ message: "Invalid or already-used login request" });
    }

    if (isExpired(user.otp.expiresAt)) {
      return res.status(400).json({ message: "OTP expired, request a new one", expired: true });
    }
    if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: "Too many attempts, request a new OTP", expired: true });
    }

    const ok = await verifyOtp(otp, user.otp.codeHash);
    if (!ok) {
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    user.otp = { codeHash: null, purpose: null, expiresAt: null, attempts: 0 };
    await user.save();

    const token = generateToken(user._id);
    return res.status(200).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    console.error("verifyLoginOtp error:", err);
    return res.status(500).json({ message: "Something went wrong, please try again" });
  }
}

// POST /api/auth/resend-otp
async function resendOtp(req, res) {
  try {
    const { identifier, purpose } = req.body; // identifier = email (register) or username (login)
    if (!identifier || !["register", "login"].includes(purpose)) {
      return res.status(400).json({ message: "identifier and a valid purpose are required" });
    }

    const user = await User.findOne(
      purpose === "register"
        ? { email: identifier.trim().toLowerCase() }
        : { username: identifier }
    );

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (purpose === "register" && user.isVerified) {
      return res.status(400).json({ message: "Account is already verified" });
    }
    if (purpose === "login" && !user.isVerified) {
      return res.status(400).json({ message: "Verify your email before logging in" });
    }

    await issueOtp(user, purpose);
    return res.status(200).json({ message: "A new OTP has been sent" });
  } catch (err) {
    console.error("resendOtp error:", err);
    return res.status(500).json({ message: "Something went wrong, please try again" });
  }
}

module.exports = { register, verifyRegistration, login, verifyLoginOtp, resendOtp };
