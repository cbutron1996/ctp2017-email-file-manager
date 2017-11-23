const express = require('express');
const models = require('../models');
const Emails = models.Emails;
const router = express.Router();
const google = require('googleapis');
const gmail = google.gmail('v1');
const atob = require('atob');

function getMessagesFull(req, messages) {
  messages.forEach(function(message) {
    gmail.users.messages.get({
      access_token: req.user.accessToken,
      userId: 'me',
      id: message.id,
    }, function(err, response) {
      if (err) {
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
        var date = headers.find(function(element) {
          return element.name === "Date";
        });

        var body = response.snippet;

        var num_attach = 1000;
        if(response.payload.parts) {
          num_attach = response.payload.parts.length-1;
        }

        if(email) {
          email.updateAttributes({
            message_id: response.id,
            subject: subject.value,
            to: to.value,
            from: from.value,
            date: date.value,
            body: body,
            num_attach: num_attach,
            user_id: req.user.email,
          });
        } else {
          Emails.create({
            message_id: response.id,
            subject: subject.value,
            to: to.value,
            from: from.value,
            date: date.value,
            body: body,
            num_attach: num_attach,
            user_id: req.user.email,
          });
        }
      });
    });
  });
}

function getMessages(req, res) {
  var request = gmail.users.messages.list({
    access_token: req.user.accessToken,
    userId: 'me',
    labelIds: ['INBOX'],
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
    var data = response.data;
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(data, null, '\t'));
  });
}

router.get('/', (req, res) => {
  getMessages(req, res);
});

router.get('/:id', (req, res) => {
  getMessage(req, res);
});

router.get('/:id/:aid', (req, res) => {
  getAttachment(req, res);
});


module.exports = router;
