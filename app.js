const bodyParser = require('body-parser');
const express = require('express');
const models = require('./models');
const expressSession = require('express-session');
const passport = require('./middlewares/authentication');

const PORT = process.env.PORT || 8000;

const app = express();

const SCOPES = ['email', 'profile', 'https://mail.google.com/'];

//const Gmail = require('node-gmail-api');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable sessions & passport
app.use(expressSession(({ secret: 'keyboard cat', resave: false, saveUninitialized: true })));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google', passport.authenticate('google', { scope : SCOPES }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Uncomment the following if you want to serve up static assets.
// (You must create the public folder)

app.use(express.static('./public'));


// Uncomment the following if you want to use handlebars
// on the backend. (You must create the views folder)
const exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
  layoutsDir: './views/layouts',
  defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/views/`);


// React Views
// app.set('views', __dirname + '/views_react');
// app.set('view engine', 'jsx');
// app.engine('jsx', require('express-react-views').createEngine());

// Load up all of the controllers
const controllers = require('./controllers');
app.use(controllers)


// First, make sure the Database tables and models are in sync
// then, start up the server and start listening.
models.sequelize.sync({force: false})
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is up and running on port: ${PORT}`)
    });
  });
