const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createProfile,
  updateProfile,
  getUserById,
  getCurrentUser
} = require("../controllers/userController");

// 🔐 Profile Routes
router.post("/create-profile", auth, upload.single("photo"), createProfile);
router.put("/update-profile", auth, upload.single("photo"), updateProfile);

// 🔍 User Info
router.get("/me", auth, getCurrentUser);
router.get("/:userId", auth, getUserById);

module.exports = router;
