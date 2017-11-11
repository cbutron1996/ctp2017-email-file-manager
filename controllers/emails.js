const express = require('express');
const models = require('../models');
const Emails = models.Emails;

const router = express.Router();

const google = require('googleapis');
const gmail = google.gmail('v1');

router.get('/', (req, res) => {
  gmail.users.messages.list({
    access_token: req.user.accessToken,
    userId: 'me'
  }, function(err, response) {
    if (err) {
      res.json({ err });
      return;
    }
    var messages = response.messages;
    res.json(messages);
  });
});

router.get('/:id', (req, res) => {
  var messageID = req.params.id;
  gmail.users.messages.get({
    access_token: req.user.accessToken,
    userId: 'me',
    id: req.params.id
  }, function(err, response) {
    if (err) {
      res.json({ err });
      return;
    }
    var snippet = response.snippet;
    res.json(snippet);
  });
});


module.exports = router;
