const User = require('../models/User')
const Report = require('../models/Report')

const upload = require("../middleware/upload")
const cloudinary = require("../utils/cloudinary")

const { sendEmail } = require("../utils/mailer")


// NGO Takes a Report
exports.takeReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { dueDate } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ msg: "Report not found" });

    if (report.status !== "pending") {
      return res.status(400).json({ msg: "Only pending reports can be taken" });
    }

    report.status = "taken";
    report.takenBy = req.user._id;
    report.takenOn = new Date();
    report.dueDate = new Date(dueDate);
    await report.save();

    // 📩 Send email to user who posted the report
    const user = await User.findById(report.postedBy);
    // 🔍 Get NGO (current logged in user)
    const ngo = await User.findById(req.user._id);

    if (user && ngo) {
  await sendEmail(
    user.email,
    "🧹 Your Report Has Been Taken by an NGO",
    `
    <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; color: #333;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px;">
        <h2 style="color: #1976d2;">Your Report Has Been Taken</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Your report titled <strong>${report.title}</strong> has been taken up by the NGO <strong>${ngo.name}</strong>.</p>
        <p>They are scheduled to resolve the issue by <strong>${new Date(dueDate).toDateString()}</strong>.</p>
        <p>Thank you for taking action and contributing to a cleaner, healthier environment! 🌱</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 14px; color: #777;">You’ll be notified once the report is marked as resolved.</p>
        <p style="font-size: 14px; color: #777;">— The EcoTrack Team</p>
      </div>
    </div>
    `
  );
}

    res.json({ msg: "Report taken successfully", report });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};



exports.completeReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { description } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "At least one resolved image is required" });
    }

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ msg: "Report not found" });

    if (report.status !== "taken" || report.takenBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "You are not authorized to complete this report" });
    }

    // 📤 Upload resolved images
    const resolvedImages = [];
    for (let file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "greentrack/resolved",
      });
      resolvedImages.push(result.secure_url);
    }

    report.status = "completed";
    report.resolvedImages = resolvedImages;
    report.resolvedOn = new Date();

    if (description) {
      report.resolutionDescription = description; // 🔁 You must have this field in your Report model
    }
    await report.save();

    // 📧 Send Email to the original user
    const user = await User.findById(report.postedBy);
    const ngo = await User.findById(req.user._id);

    if (user && ngo) {
  await sendEmail(
    user.email,
    "✅ Your Report Has Been Resolved!",
    `
    <div style="font-family: Arial, sans-serif; background-color: #f6f9fc; padding: 20px; color: #333;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px;">
        <h2 style="color: #2e7d32;">Report Successfully Resolved</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Great news! Your report titled <strong>${report.title}</strong> has been resolved by <strong>${ngo.name}</strong>.</p>
        ${
          description
            ? `<p><strong>Resolution Details:</strong> ${description}</p>`
            : ""
        }
        <p><strong>Resolved On:</strong> ${new Date(report.resolvedOn).toDateString()}</p>
        <p>You can now view the resolved Images and updated status in your EcoTrack dashboard.</p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://your-frontend-url.com/dashboard" target="_blank" style="display: inline-block; padding: 12px 25px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">View Report</a>
        </div>

        <hr style="margin: 40px 0 20px;">
        <p style="font-size: 14px; color: #777;">Thank you for helping build a cleaner and more sustainable world.</p>
        <p style="font-size: 14px; color: #777;">— The EcoTrack Team 🌱</p>
      </div>
    </div>
    `
  );
}



    res.json({ msg: "Report marked as completed", report });
  } catch (err) {
    res.status(500).json({ msg: "Failed to complete report", error: err.message });
  }
};


// ✅ Taken Reports
exports.getTakenReports = async (req, res) => {
  try {
    const reports = await Report.find({
      status: "taken",
      takenBy: req.params.userId
    })
      .populate("postedBy", "name role photo city")
      .sort({ takenOn: -1 });

    res.json({
      msg: "Taken reports fetched successfully",
      count: reports.length,
      reports,
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch taken reports", error: err.message });
  }
};

// ✅ Completed Reports
exports.getCompletedReports = async (req, res) => {
  try {
    const reports = await Report.find({
      status: "completed",
      takenBy: req.params.userId
    })
      .populate("postedBy", "name role photo city")
      .sort({ resolvedOn: -1 });

    res.json({
      msg: "Completed reports fetched successfully",
      count: reports.length,
      reports,
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch completed reports", error: err.message });
  }
};

// ✅ Incompleted Reports
exports.getIncompletedReports = async (req, res) => {
  try {
    const reports = await Report.find({
      incompletedBy: req.params.userId
    })
      .populate("postedBy", "name role photo city")
      .sort({ updatedAt: -1 });

    res.json({
      msg: "Incompleted reports fetched successfully",
      count: reports.length,
      reports,
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch incompleted reports", error: err.message });
  }
};
