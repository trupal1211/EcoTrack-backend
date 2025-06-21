// ✅ controllers/reportController.js
const Report = require("../models/Report");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/upload")

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



// Create Report
exports.createReport = async (req, res) => {
  try {
    const {
      title,
      description,
      landmark,
      city,
      autoLocation
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "At least one photo is required" });
    }

    const photos = req.files.map(file => file.path);

    const newReport = new Report({
      title,
      description,
      landmark,
      city,
      autoLocation,
      photos,
      postedBy: req.user._id,
      status: "pending"
    });

    await newReport.save();
    res.status(201).json({ msg: "Report submitted", report: newReport });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get All Reports - Filter
exports.getReportsByFilter = async (req, res) => {
  try {
    const { city, status } = req.query;
    const query = {};
    if (city) query.city = city;
    if (status) query.status = status;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate("postedBy", "name role email photo city")
      .populate("takenBy", "name email photo");

    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch reports", error: err.message });
  }
};

// Get Reports By reportId
exports.getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate("postedBy", "name email role photo city") // user who posted the report
      .populate("takenBy", "name email role photo city")  // ngo who took the report
      .exec();

    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    res.json({ report });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch report", error: err.message });
  }
};


// Get Report By UserId 
exports.getReportsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const reports = await Report.find({ postedBy: userId })
      .populate("postedBy", "name email city photo") // optional
      .populate("takenBy", "name email city photo")  // NGO info
      .sort({ createdAt: -1 });

    if (!reports || reports.length === 0) {
      return res.status(404).json({ msg: "No reports found for this user" });
    }

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch reports", error: err.message });
  }
};

// Get Reports By TakenId
exports.getReportsByTakenId = async (req, res) => {
  try {
    const { takenBy } = req.params;

    const reports = await Report.find({ takenBy })
      .sort({ createdAt: -1 })
      .populate("postedBy", "name email photo")
      .populate("takenBy", "name email photo");

    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch reports", error: err.message });
  }
};



// Upvote Report
exports.upvoteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) return res.status(404).json({ msg: "Report not found" });

    if (report.upvotes.includes(req.user._id)) {
      return res.status(400).json({ msg: "Already upvoted" });
    }

    report.upvotes.push(req.user._id);
    await report.save();
    res.json({ msg: "Report upvoted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// Remove Upvote
exports.removeUpvote = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) return res.status(404).json({ msg: "Report not found" });

    const index = report.upvotes.indexOf(req.user._id);
    if (index === -1) {
      return res.status(400).json({ msg: "You haven't upvoted this report" });
    }

    report.upvotes.splice(index, 1);
    await report.save();
    res.json({ msg: "Upvote removed" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// Add Comment
exports.addComment = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ msg: "Comment cannot be empty" });

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ msg: "Report not found" });

    report.comments.push({ user: req.user._id, text });
    await report.save();
    res.json({ msg: "Comment added" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};



// Get Reports Created by Logged-in User
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// Get Reports Upvoted by Logged-in User
exports.getUpvotedReports = async (req, res) => {
  try {
    const reports = await Report.find({ upvotes: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get Reports Commented on by Logged-in User
exports.getCommentedReports = async (req, res) => {
  try {
    const reports = await Report.find({
      "comments.user": req.user._id
    }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};



