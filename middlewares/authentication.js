const bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Users = require('../models').Users;

passport.use(new GoogleStrategy({
    clientID        : '434306998415-5f832nmc41pk44u6t6op0nfsp60la88s.apps.googleusercontent.com',
    clientSecret    : '49Dwi-UagnZHF-zKfWfRBIu3',
    callbackURL     : 'http://localhost:8000/auth/google/callback'
  }, function(accessToken, refreshToken, profile, cb) {
    Users.findOne({
      where: { googleId: profile.id }
    }).then(user => {
      if(user) {
        user.updateAttributes({
          accessToken: accessToken
        });
        cb(null, user);
      } else {
        Users.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          accessToken: accessToken
        }).then(user => {
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
