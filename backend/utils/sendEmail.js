const nodemailer = require("nodemailer");

let transporter = null;

/** Lazily configures Nodemailer transporter so missing .env doesn't crash startup. */
function ensureConfigured() {
  if (!transporter) {
    const service = process.env.EMAIL_SERVICE;
    const config = {};
    if (service) {
      config.service = service;
      config.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      };
    } else {
      config.host = process.env.EMAIL_HOST;
      config.port = parseInt(process.env.EMAIL_PORT || "587");
      config.secure = process.env.EMAIL_SECURE === "true"; // true for port 465, false for others
      config.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      };
    }
    transporter = nodemailer.createTransport(config);
  }
}

async function sendOtpEmail({ to, otp, purpose, username }) {
  ensureConfigured();

  const heading =
    purpose === "register" ? "Verify your email" : "Your login code";
  const intro =
    purpose === "register"
      ? `Welcome${username ? `, ${username}` : ""}. Use the code below to verify your email and activate your account.`
      : `Use the code below to finish signing in${username ? ` as ${username}` : ""}.`;

  const html = `
  <div style="background:#0E0E12;padding:32px;font-family:'IBM Plex Sans',Arial,sans-serif;color:#EDEAE3;">
    <div style="max-width:420px;margin:0 auto;background:#181820;border-radius:12px;padding:32px;border:1px solid #2A2A33;">
      <p style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#E8A33D;margin:0 0 8px;">Progress Tracker</p>
      <h1 style="font-size:22px;margin:0 0 16px;color:#EDEAE3;">${heading}</h1>
      <p style="font-size:14px;line-height:1.6;color:#B8B5AE;margin:0 0 24px;">${intro}</p>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:32px;letter-spacing:0.15em;font-weight:600;color:#D6402F;background:#0E0E12;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
        ${otp}
      </div>
      <p style="font-size:12px;color:#7A776F;margin:0;">This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  </div>`;

  const text = `${heading}\n\n${intro}\n\nYour code: ${otp}\n\nThis code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: purpose === "register" ? "Verify your email" : "Your login code",
      text,
      html,
    });
  } catch (err) {
    console.error("Nodemailer send failed:", err.message);
    throw new Error(`Failed to send OTP email: ${err.message}`);
  }
}

module.exports = { sendOtpEmail };
