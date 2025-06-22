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
  getAllReports,
} = require("../controllers/reportController");


// 📍 Report Routes
router.post("/", auth, upload.array("photos", 5), createReport);
router.get("/", getAllReports); // all reports with filter
router.get("/filter", getReportsByFilter); // optional custom filters
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


module.exports = router;
