const bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Users = require('../models').Users;

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: "434306998415-5f832nmc41pk44u6t6op0nfsp60la88s.apps.googleusercontent.com",
    clientSecret: "49Dwi-UagnZHF-zKfWfRBIu3",
    callbackURL: "http://localhost:8000"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

function passwordsMatch(passwordSubmitted, storedPassword) {
  return bcrypt.compareSync(passwordSubmitted, storedPassword);
}

passport.use(new LocalStrategy({
    usernameField: 'email',
  },
  (email, password, done) => {
    Users.findOne({
      where: { email },
    }).then((user) => {
      debugger;

      if(!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }

      if (passwordsMatch(password, user.password) === false) {
        console.log('\n\nerror match\n\n')
        return done(null, false, { message: 'Incorrect password.' });
      }

      console.log('\n\ncorrect login!!\n\n')
      return done(null, user, { message: 'Successfully Logged In!' });
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Users.findById(id).then((user) => {
    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  });
});

passport.redirectIfLoggedIn = (route) =>
  (req, res, next) => (req.user ? res.redirect(route) : next());

passport.redirectIfNotLoggedIn = (route) =>
  (req, res, next) => (req.user ? next() : res.redirect(route));

module.exports = passport;
