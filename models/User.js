const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isProfileCompleted: { type: Boolean, default: false },
  password: { type: String },       // for manual login
  googleId: { type: String },       // if login via Google
  photo: { type: String },
  city: { type: String },           // manually entered
  role: {
    type: String,
    enum: ["user", "ngo"],
    default: "user"
  },

  // ✅ NGO-specific fields
  registrationNumber: {
    type: String,
    default: null
  },
  mobileNumber: {
  type: String,
  default: null
}

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
