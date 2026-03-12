const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {

      try {

        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {

          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: "google-auth"
          });

          await user.save();
        }

        return done(null, user);

      } catch (error) {

        return done(error, null);

      }

    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  done(null, id);
});