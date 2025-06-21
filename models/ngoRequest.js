// models/NgoRequest.js
const mongoose = require("mongoose");

const NgoRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }, // for follow-up
  logo: { type: String },
  registrationNumber: { type: String, required: true },
  city: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("NgoRequest", NgoRequestSchema);
