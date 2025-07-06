const User = require('../models/User')
const Report = require('../models/Report')
const NgoRequest = require("../models/ngoRequest");
const { sendEmail } = require("../utils/mailer");

// 🛡️ ADMIN APIs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getAllNGOs = async (req, res) => {
  try {
    const ngos = await User.find({ role: "ngo" }).select("-password");
    res.json(ngos);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.reportId);
    res.json({ msg: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.changeReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      { status },
      { new: true }
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};





exports.getAllNgoRequests = async (req, res) => {
  try {
    const requests = await NgoRequest.find().select("-password");
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch NGO requests", error: err.message });
  }
};



exports.handleNgoApproval = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; 

    const request = await NgoRequest.findById(requestId);
    if (!request) return res.status(404).json({ msg: "Request not found" });

    const emailContent = {
  approve: {
    subject: "🎉 Your NGO Registration Has Been Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f6f9fc; color: #333;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 30px;">
          <h2 style="color: #2e7d32;">Welcome to EcoTrack!</h2>
          <p>Dear <strong>${request.name}</strong>,</p>
          <p>We’re excited to let you know that your NGO registration has been <strong>approved</strong>.</p>
          <p>You can now log in to EcoTrack using your registered email: <strong>${request.email}</strong>.</p>
          <p>Thank you for joining our mission to build a cleaner and greener future.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 14px; color: #777;">If you have any questions, feel free to reach out to our support team.</p>
          <p style="font-size: 14px; color: #777;">– The EcoTrack Team</p>
        </div>
      </div>
    `,
  },

  reject: {
    subject: "❌ NGO Registration Request Declined",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f6f9fc; color: #333;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); padding: 30px;">
          <h2 style="color: #c62828;">NGO Request Status: Rejected</h2>
          <p>Dear <strong>${request.name}</strong>,</p>
          <p>We regret to inform you that your NGO registration request was <strong>not approved</strong> at this time.</p>
          <p>If you believe this was a mistake or require further clarification, please don’t hesitate to contact our support team.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 14px; color: #777;">Thank you for your interest in EcoTrack.</p>
          <p style="font-size: 14px; color: #777;">– The EcoTrack Team</p>
        </div>
      </div>
    `,
  },
};


    if (action === "approve") {
      // Create or update user
      let user = await User.findOne({ email: request.email });

    if (["admin", "ngo"].includes(user.role)) {
      return res.status(409).json({ msg: "User already has a role" });
    }

      if (user) {
        user.role = "ngo";
        user.registrationNumber = request.registrationNumber;
        user.mobileNumber = request.mobileNumber;
        user.city = request.city;
        user.name = request.name;
        user.photo = request.logo;
        user.isProfileCompleted = true;
        await user.save();
      } else {
        user = new User({
          email: request.email,
          role: "ngo",
          registrationNumber: request.registrationNumber,
          mobileNumber: request.mobileNumber,
          city: request.city,
          name: request.name,
          photo: request.logo,
          isProfileCompleted: true,
        });
        await user.save();
      }

      request.status = "approved";
      await request.save();
      
      await sendEmail(request.email, emailContent.approve.subject, emailContent.approve.html);
      res.json({ msg: "NGO approved and added to system ( Mail Send )", user });

    } else if (action === "reject") {
      request.status = "rejected";
      await request.save();
      await sendEmail(request.email, emailContent.reject.subject, emailContent.reject.html);
      res.json({ msg: "NGO request rejected Mail send" });
    } else {
      res.status(400).json({ msg: "Invalid action. Use 'approve' or 'reject'." });
    }
  } catch (err) {
    res.status(500).json({ msg: "Approval failed", error: err.message });
  }
};




exports.removeNgoRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role !== "ngo") return res.status(400).json({ msg: "User is not an NGO" });

    user.role = "user";
    user.registrationNumber = undefined;
    user.mobileNumber = undefined;

    // Only name and city are required for user
    user.isProfileCompleted = Boolean(user.name && user.city); 

    await user.save();

    res.json({ msg: "NGO role removed and user demoted successfully", user });
  } catch (err) {
    res.status(500).json({ msg: "Failed to remove NGO role", error: err.message });
  }
};



exports.deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    await user.deleteOne();

    return res.status(200).json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};
