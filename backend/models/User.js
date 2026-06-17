const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const progressEntrySchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    currentLecture: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const otpSchema = new mongoose.Schema(
  {
    codeHash: { type: String, default: null },
    purpose: { type: String, enum: ["register", "login"], default: null },
    expiresAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: { type: String, trim: true, maxlength: 40 },
    passwordHash: { type: String, required: true },

    isVerified: { type: Boolean, default: false },
    otp: { type: otpSchema, default: () => ({}) },

    // 'public'  -> anyone can view this user's progress
    // 'followers' -> only accounts that follow this user can view it
    visibility: { type: String, enum: ["public", "followers"], default: "followers" },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    progress: [progressEntrySchema],
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName || this.username,
    visibility: this.visibility,
    followerCount: this.followers.length,
    followingCount: this.following.length,
    progress: this.progress,
  };
};

module.exports = mongoose.model("User", userSchema);
