const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: "434306998415-5f832nmc41pk44u6t6op0nfsp60la88s.apps.googleusercontent.com",
    clientSecret: "49Dwi-UagnZHF-zKfWfRBIu3",
    callbackURL: "https://github.com/cbutron1996/ctp2017-email-file-manager"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

module.exports = passport;
