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
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(session({ secret: "your_secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/auth", require("./routes/oauthRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/ngo" , require("./routes/ngoRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// DB + Server
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(5000, () => console.log("Server Running 🚀")))
  .catch(err => console.error(err));
