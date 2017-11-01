const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: "434306998415-5f832nmc41pk44u6t6op0nfsp60la88s.apps.googleusercontent.com",
    clientSecret: "49Dwi-UagnZHF-zKfWfRBIu3",
    callbackURL: "http://www.example.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
