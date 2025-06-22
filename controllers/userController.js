// ✅ controllers/reportController.js
const Report = require("../models/Report");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/upload")


// ✅ Get current user
exports.getCurrentUser = async (req, res) => {
  res.json(req.user);
};

// 🌟 POST /api/auth/create-profile
exports.createProfile = async (req, res) => {
  try {
    const { name, city, registrationNumber, mobileNumber } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const alreadyCreated =
      user.name &&
      user.city &&
      (user.role !== "ngo" || (user.registrationNumber && user.mobileNumber)) &&
      (user.role !== "ngo" || user.photo);

    if (alreadyCreated) {
      return res.status(400).json({ msg: "Profile already completed" });
    }

    if (!name || !city) {
      return res.status(400).json({ msg: "Name and city are required" });
    }

    if (user.role === "ngo") {
      if (!registrationNumber || !mobileNumber) {
        return res.status(400).json({ msg: "NGO must provide registration number and mobile number" });
      }
      if (!req.file) {
        return res.status(400).json({ msg: "NGO must upload a profile photo" });
      }
    }

    user.name = name;
    user.city = city;

    // 📄 Upload profile photo if file provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "greentrack/profiles",
      });
      user.photo = result.secure_url;
    }

    if (user.role === "ngo") {
      user.registrationNumber = registrationNumber;
      user.mobileNumber = mobileNumber;
    }

    const isProfileCompleted =
      user.name &&
      user.city &&
      (user.role !== "ngo" || (user.registrationNumber && user.mobileNumber && user.photo));

    user.isProfileCompleted = Boolean(isProfileCompleted);
    await user.save();

    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      photo: user.photo,
    };

    if (user.role === "ngo") {
      responseUser.registrationNumber = user.registrationNumber;
      responseUser.mobileNumber = user.mobileNumber;
    }

    res.json({
      msg: "Profile created successfully",
      user: responseUser,
      isProfileCompleted: user.isProfileCompleted,
    });
  } catch (err) {
    res.status(500).json({ msg: "Profile creation failed", error: err.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {

    if (req.user.role === "ngo") {
      return res.status(403).json({ msg: "NGOs are not allowed to update their profile" });
    }

    // Handle case where body might be undefined
    const { name, city } = req.body || {};

    // 🚫 Reject if only photo is being updated
    if (!name && !city) {
      return res.status(400).json({
        msg: "At least one non-photo field must be provided to update profile",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 📝 Update fields
    if (name) user.name = name;
    if (city) user.city = city;

    // 📷 Upload photo if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "greentrack/profiles",
      });
      user.photo = result.secure_url;
    }

    // ✅ Recalculate profile completion
    const isProfileCompleted = user.name && user.city 

    user.isProfileCompleted = Boolean(isProfileCompleted);
    await user.save();

    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      photo: user.photo,
    };

    res.json({
      msg: "Profile updated successfully",
      user: responseUser
    });
  } catch (err) {
    console.error("Error in updateProfile:", err);
    res.status(500).json({
      msg: "Profile update failed",
      error: err.message,
    });
  }
};


// Get User by userId
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch user", error: err.message });
  }
};

