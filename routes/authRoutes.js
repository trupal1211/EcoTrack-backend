const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  register,
  requestForNgoRole,
  login,
  getCurrentUser,
  logout,
  setPassword,
  sendOtp,
  resetPasswordWithOtp
} = require("../controllers/authController");

const auth = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.post("/set-password",auth, setPassword);
router.post("/send-otp", sendOtp);
router.post("/reset-password", resetPasswordWithOtp);

router.get("/me", auth, getCurrentUser);

router.post("/request-ngo",upload.single("logo"),requestForNgoRole);

module.exports = router;
