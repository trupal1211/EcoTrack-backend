// ✅ controllers/reportController.js
const Report = require("../models/Report");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/upload")


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

    let parsedLocation = {};

    try {
      parsedLocation = JSON.parse(autoLocation);
    } catch (error) {
      return res.status(400).json({ msg: "Invalid autoLocation format" });
    }


    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "At least one photo is required" });
    }

    const photos = req.files.map(file => file.path);
    const newReport = new Report({
      title,
      description,
      landmark,
      city,
      autoLocation: parsedLocation,
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
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate("postedBy", "name role email photo city")
      .populate("takenBy", "name email photo");

    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch reports", error: err.message });
  }
};

// Get All Reports - Filter + Pagination
exports.getReportsByFilter = async (req, res) => {
  try {
    const { city, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (city) query.city = city;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalReports = await Report.countDocuments(query);

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("postedBy", "name role email photo city")
      .populate("takenBy", "name email photo");

    res.json({
      reports,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReports / limit),
      totalReports,
    });
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
      .populate("comments.user", "name photo") // Populate user in comments
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
    const reports = await Report.find({ postedBy: req.user._id })
                                .popolate("postedBy","name photo city")
                                .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// Get Reports Upvoted by Logged-in User
exports.getUpvotedReports = async (req, res) => {
  try {
    const reports = await Report.find({ upvotes: req.user._id })
                                .popolate("postedBy","name photo city")
                                .sort({ createdAt: -1 });
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



