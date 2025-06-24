const express = require("express");
const passport = require("passport");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Start OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // // ⛔️ If user has no password, redirect to set-password page
    // if (!req.user.password) {
    //   return res.redirect(`http://localhost:5173/set-password?email=${req.user.email}`);
    // }

  res.redirect(`${process.env.FRONTEND_URL}/oauth/success`);
  }
);

module.exports = router;
