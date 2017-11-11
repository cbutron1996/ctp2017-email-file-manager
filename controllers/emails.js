const express = require('express');
const models = require('../models');

const router = express.Router();

const google = require('googleapis');

router.get('/', (req, res) => {
  var gmail = google.gmail('v1');
  gmail.users.messages.list({
    access_token: req.user.accessToken,
    userId: 'me'
  }, function(err, response) {
    if (err) {
      res.json({ err });
      return;
    }
    var emails = response.messages;
    res.json(emails);
  });
});


module.exports = router;
