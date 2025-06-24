const User = require("../models/User");
const NgoRequest = require("../models/ngoRequest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("../utils/passport")
const passport = require("passport");
const cloudinary = require("cloudinary").v2;
const otpStore = new Map(); // Consider using Redis/DB for production
const {sendEmail} = require("../utils/mailer");

const JWT_SECRET = process.env.JWT_SECRET;

// 🔐 Register (user / ngo)
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user: newUser });
  } catch (err) {
    res.status(500).json({ msg: "Registration failed", error: err.message });
  }
};

// 🔑 Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ user});
  } catch (err) {
    res.status(500).json({ msg: "Login failed", error: err.message });
  }
};


// 🚪 Logout
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ msg: "Logged out successfully" });
};

// Reset Password
exports.resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otpStore.get(email);

  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();

  otpStore.delete(email);

  res.json({ msg: "Password reset successfully" });
};


exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ msg: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

  await sendEmail(
  email,
  "🔐 OTP for Password Reset",
  `
  <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 30px;">
      <h2 style="color: #1976d2;">Reset Your Password</h2>
      <p>You have requested to reset your password. Please use the OTP below to proceed:</p>
      <p style="font-size: 24px; font-weight: bold; color: #d32f2f; text-align: center; margin: 20px 0;">${otp}</p>
      <p>This OTP is valid for a limited time only. Please do not share it with anyone.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 14px; color: #777;">If you didn’t request a password reset, please ignore this email.</p>
      <p style="font-size: 14px; color: #777;">— EcoTrack Security Team 🔐</p>
    </div>
  </div>
  `
);

  res.json({ msg: "OTP sent to your email" });
};


// Set Password For those who have login with google
exports.setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.password)
      return res.status(400).json({ msg: "Password already set. Use update password instead." });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ msg: "Password set successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to set password", error: err.message });
  }
};





exports.requestForNgoRole = async (req, res) => {
  try {
    const { name, email, city, registrationNumber, mobileNumber, message } = req.body;

    const existingRequest = await NgoRequest.findOne({ email, status: "pending" });
    if (existingRequest) {
      return res.status(400).json({ msg: "A pending request already exists with this email." });
    }

    let logoUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "greentrack/ngos",
      });
      logoUrl = result.secure_url;
    }

    const request = new NgoRequest({
      name,
      email,
      city,
      registrationNumber,
      mobileNumber,
      message,
      logo: logoUrl, // 🔗 Add logo field in your schema
    });

    await request.save();
    res.status(201).json({ msg: "NGO request submitted successfully", request });
  } catch (err) {
    res.status(500).json({ msg: "Submission failed", error: err.message });
  }
};

