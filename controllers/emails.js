const express = require('express');
const models = require('../models');
const Emails = models.Emails;
const router = express.Router();
const google = require('googleapis');
const gmail = google.gmail('v1');

function getMessagesFull(req, messages) {
  messages.forEach(function(message) {
    gmail.users.messages.get({
      access_token: req.user.accessToken,
      userId: 'me',
      id: message.id,
    }, function(err, response) {
      if (err) {
        res.json(err);
        return;
      }
      Emails.findOne({
        where: { message_id: response.id }
      }).then(email => {
        var headers = response.payload.headers;
        
        var subject = headers.find(function(element) {
          return element.name === "Subject";
        });
        var to = headers.find(function(element) {
          return element.name === "To";
        });
        var from = headers.find(function(element) {
          return element.name === "From";
        });

        if(email) {
          email.updateAttributes({
            user_id: req.user.email,
            message_id: response.id,
            subject: subject.value,
            to: to.value,
            from: from.value,
          });
        } else {
          Emails.create({
            user_id: req.user.email,
            message_id: response.id,
            subject: subject.value,
            to: to.value,
            from: from.value,
          });
        }
      });
    });
  });
}

function getMessages(req, res) {
  var request = gmail.users.messages.list({
    access_token: req.user.accessToken,
    userId: 'me'
  }, function(err, response) {
    if (err) {
      res.json(err);
      return;
    }
    var messages = response.messages;
    getMessagesFull(req, messages);
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(response, null, '\t'));
  });
}

function getMessage(req, res) {
  gmail.users.messages.get({
    access_token: req.user.accessToken,
    userId: 'me',
    id: req.params.id,
  }, function(err, response) {
    if (err) {
      res.json(err);
      return;
    }
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(response, null, '\t'));
  });
}

function getAttachments(req, res) {
  gmail.users.messages.get({
    access_token: req.user.accessToken,
    userId: 'me',
    id: req.params.id
  }, function(err, response) {
    if (err) {
      res.json(err);
      return;
    }
    var parts = response.payload.parts;
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(parts, null, '\t'));
  });
}

function getAttachment(req, res) {
  gmail.users.messages.attachments.get({
    access_token: req.user.accessToken,
    userId: 'me',
    id: req.params.aid,
    messageId: req.params.id
  }, function(err, response) {
    if (err) {
      res.json({ err });
      return;
    }
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(response, null, '\t'));
  });
}

router.get('/', (req, res) => {
  getMessages(req, res);
});

router.get('/:id', (req, res) => {
  getMessage(req, res);
});

router.get('/:id/attachments', (req, res) => {
  getAttachments(req, res);
});

router.get('/:id/attachments/:aid', (req, res) => {
  getAttachment(req, res);
});


module.exports = router;
