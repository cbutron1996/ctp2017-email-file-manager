const bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Users = require('../models').Users;

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID        : '434306998415-5f832nmc41pk44u6t6op0nfsp60la88s.apps.googleusercontent.com',
    clientSecret    : '49Dwi-UagnZHF-zKfWfRBIu3',
    callbackURL     : 'http://localhost:8000/auth/google/callback'
  }, function(accessToken, refreshToken, profile, cb) {
    //console.log(accessToken);
    // Users.findOne({ email: profile.emails[0].value }).then((user) => {
    //   user.accessToken = accessToken;
    //   cb(null, user);
    // });
    Users.findOne({
      where: { googleId: profile.id }
    }).then(user => {
      if(user) {
        user.accessToken = accessToken;
        cb(null, user);
      } else {
        // var newUser = new Users();
        // newUser.googleId = profile.id;
        // newUser.accessToken = accessToken;
        // newUser.name = profile.displayName;
        // newUser.email = profile.emails[0].value;
        //
        // newUser.save();
        // user = newUser;
        // cb(null, user);

        Users.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          accessToken: accessToken
        }).then((user) => {
          cb(null, user);
        });
      }
    });
  }
));

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
