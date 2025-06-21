const User = require("../models/User");

const roleMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // User must be authenticated first (auth middleware should run before this)
      if (!req.user) {
        return res.status(401).json({ msg: "Not authenticated" });
      }

      // Fetch user role if not already in req.user
      if (!req.user.role) {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(401).json({ msg: "User not found" });
        req.user.role = user.role;
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ msg: "Access denied: insufficient role" });
      }

      next();
    } catch (err) {
      console.error("Role middleware error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  };
};

module.exports = roleMiddleware;
