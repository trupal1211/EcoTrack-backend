const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createReport,
  getReportsByFilter,
  getReportById,
  getReportsByUserId,
  getReportsByTakenId,
  upvoteReport,
  removeUpvote,
  addComment,
  getMyReports,
  getUpvotedReports,
  getCommentedReports,
  createProfile,
  updateProfile,
  getUserById,
  getAllReports,
  getCurrentUser
} = require("../controllers/userController");

// 🔐 Profile Routes
router.post("/create-profile", auth, upload.single("photo"), createProfile);
router.put("/update-profile", auth, upload.single("photo"), updateProfile);

// 📍 Report Routes
router.post("/reports", auth, upload.array("photos", 5), createReport);
router.get("/reports", getAllReports); // all reports with filter
router.get("/filter-reports", getReportsByFilter); // optional custom filters
router.get("/reports/:reportId", auth, getReportById);
router.get("/reports-by/:userId", auth, getReportsByUserId);
router.get("/reports-takenby/:takenBy", auth, getReportsByTakenId);

// 👍 Upvote & Comment
router.post("/upvote/:reportId", auth, upvoteReport);
router.delete("/upvote/:reportId", auth, removeUpvote);
router.post("/comment/:reportId", auth, addComment);

// 👤 User Activity
router.get("/my-reports", auth, getMyReports);
router.get("/my-upvotes", auth, getUpvotedReports);
router.get("/my-comments", auth, getCommentedReports);

// 🔍 User Info
router.get("/me", auth, getCurrentUser);
router.get("/:userId", auth, getUserById);

module.exports = router;
