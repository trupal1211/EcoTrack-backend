const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
require("./jobs/overdueCleaner"); // 🕒 Start overdue report checker
const session = require("express-session");
dotenv.config();

require("./utils/passport");
const passport = require("passport");
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(session({ secret: "your_secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/oauth", require("./routes/oauthRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/ngo" , require("./routes/ngoRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// DB + Server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log("Server Running 🚀")))
  .catch(err => console.error(err));
