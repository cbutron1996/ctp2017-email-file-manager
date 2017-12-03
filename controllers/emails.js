const express = require('express');
const models = require('../models');
const Emails = models.Emails;
const router = express.Router();
const google = require('googleapis');
const gmail = google.gmail('v1');
const atob = require('atob');

function getMessages2(req, messages) {
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

        var num_attach = 0;
        if(response.payload.parts) {
          response.payload.parts.forEach(function(part) {
            if(part.filename && part.filename.length > 0)
              num_attach++;
          })
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

function updateMessages(req) {
  Emails.findAll({
    where: { user_id: req.user.email }
  }).then((emails) => {
      emails.forEach(function(email) {
        messageId = email.message_id;
        gmail.users.messages.get({
          access_token: req.user.accessToken,
          userId: 'me',
          id: messageId,
        }, function(err, response) {
          if (err) return;
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

          var num_attach = 0;
          if(response.payload.parts) {
            response.payload.parts.forEach(function(part) {
              if(part.filename && part.filename.length > 0)
                num_attach++;
            })
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
          }
        });
      });
    }
  );
}

function getMessages(req, res) {
  var request = gmail.users.messages.list({
    access_token: req.user.accessToken,
    userId: 'me',
    labelIds: ['INBOX'],
    maxResults: 500,
    // pageToken: pageToken,
  }, function(err, response) {
    if (err) {
      res.json(err);
      return;
    }
    var messages = response.messages;
    var nextPageToken = response.nextPageToken;
    getMessages2(req, messages);
    res.json("Complete");
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
    // const dl = Buffer.from(response.payload.parts[1].parts[0].body.data.toString('utf-8'), 'base64');
    // res.end(dl);
    res.header("Content-Type", 'application/json');
    res.send(JSON.stringify(response, null, '\t'));
  });
}

router.get('/', (req, res) => {
  if(req.query.search == null || req.query.search == '$ALL') {
    res.redirect('/emails?search=');
    return;
  }
  updateMessages(req);
  Emails.findAll({
    where: {
      user_id: req.user.email,
      $or: [
        {  subject: { $like: '%' + req.query.search + '%', }, },
        {  to: { $like: '%' + req.query.search + '%', }, },
        {  from: { $like: '%' + req.query.search + '%', }, },
        {  body: { $like: '%' + req.query.search + '%', }, },
        {  date: { $like: '%' + req.query.search + '%', }, },
      ],
    }
  }).then((emails) => {
      res.render('email_section', {
        user: req.user,
        emails: emails,
      })
    }
  );
});

router.get('/fetch', (req, res) => {
  getMessages(req, res);
});

router.get('/:id', (req, res) => {
  getMessage(req, res);
});


module.exports = router;
