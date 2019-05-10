const bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Users = require('../models').Users;

passport.use(new GoogleStrategy({
    clientID        : `${process.env.CLIENT_ID}`,
    clientSecret    : `${process.env.CLIENT_SECRET}`,
    callbackURL     : `${process.env.APP_HOST}/auth/google/callback`
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
