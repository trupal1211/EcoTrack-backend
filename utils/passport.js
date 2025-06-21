const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const AdminConfig = require("../models/Adminconfig"); // optional if using separate collection
const passport = require("passport")


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const name = profile.displayName;

      try {
        let user = await User.findOne({ email });

        // 🔍 Check if this email is pre-approved as admin
        const admin = await AdminConfig.findOne({ email });

        if (!user) {
          // 👤 Create new user with proper role
          const role = admin ? "admin" : "user";

          user = new User({
            name,
            email,
            role,
            isProfileCompleted: role === "admin", // admin is always completed
          });

          await user.save();
        }

        // ⛔ If user is NGO but not approved by admin, block login
        if (user.role === "ngo" && !user.isProfileCompleted) {
          return done(null, false); // send 403 or error in callback
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
