const express = require('express');
const models = require('../models');
const Emails = models.Emails;
const router = express.Router();
const google = require('googleapis');
const gmail = google.gmail('v1');
const atob = require('atob');

function formatDate(date) {
  date = new Date(date);
  var monthNames = [
    "Jan", "Feb", "Mar",
    "Apr", "May", "June", "July",
    "Aug", "Sep", "Oct",
    "Nov", "Dec"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return day + ' ' + monthNames[monthIndex] + ' ' + year;
}

function getPageOfMessages(req, response) {
  var messages = response.messages;
  getMessages2(req, messages)
  var nextPageToken = response.nextPageToken;
  if(nextPageToken == null) return;
  if(nextPageToken) {
    var request = gmail.users.messages.list({
      access_token: req.user.accessToken,
      userId: 'me',
      // q: query,
      // labelIds: ['INBOX'],
      maxResults: 500,
    }, function(err, response) {
      if (err) return;
      getPageOfMessages(req, response);
    });
  }
}

function listMessages(req) {
  var initialRequest = gmail.users.messages.list({
    access_token: req.user.accessToken,
    userId: 'me',
    // q: query,
    // labelIds: ['INBOX'],
    maxResults: 500,
  }, function(err, response) {
    if (err) return;
    getPageOfMessages(req, response);
  });
}

function getMessages2(req, messages) {
  messages.forEach(function(message) {
    gmail.users.messages.get({
      access_token: req.user.accessToken,
      userId: 'me',
      id: message.id,
    }, function(err, response) {
      if (err) return;
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

        var internalDate = response.internalDate;

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
            date: formatDate(date.value),
            body: body,
            num_attach: num_attach,
            user_id: req.user.email,
            internalDate: internalDate,
          });
        } else {
          Emails.create({
            message_id: response.id,
            subject: subject.value,
            to: to.value,
            from: from.value,
            date: formatDate(date.value),
            body: body,
            num_attach: num_attach,
            user_id: req.user.email,
            internalDate: internalDate,
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

          var internalDate = response.internalDate;

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
              date: formatDate(date.value),
              body: body,
              num_attach: num_attach,
              user_id: req.user.email,
              internalDate: internalDate,
            });
          }
        });
      });
    }
  );
}

function getMessages(req) {
  var request = gmail.users.messages.list({
    access_token: req.user.accessToken,
    userId: 'me',
    // labelIds: ['INBOX'],
    maxResults: 500,
  }, function(err, response) {
    if (err) return;
    var messages = response.messages;
    getMessages2(req, messages);
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
    console.log(response);
  });
}

router.get('/', (req, res) => {
  if(req.query.search == null) {
    res.redirect('/emails?search=');
    return;
  }
  getMessages(req);
  updateMessages(req);
  // listMessages(req);

  let limit = 25;
  let offset = 0;
  let pages = 0;
  let count = 0;
  Emails.findAndCountAll({
    where: {
      user_id: req.user.email,
      $or: [
        {  subject: { $like: '%' + req.query.search + '%', }, },
        {  to: { $like: '%' + req.query.search + '%', }, },
        {  from: { $like: '%' + req.query.search + '%', }, },
        {  body: { $like: '%' + req.query.search + '%', }, },
        {  date: { $like: '%' + req.query.search + '%', }, },
        {  message_id: { $like: '%' + req.query.search + '%', }, },
      ],
    },
  }).then(data => {
    count = data.count;
    let page = 1;
    pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);
    Emails.findAll({
      where: {
        user_id: req.user.email,
        $or: [
          {  subject: { $like: '%' + req.query.search + '%', }, },
          {  to: { $like: '%' + req.query.search + '%', }, },
          {  from: { $like: '%' + req.query.search + '%', }, },
          {  body: { $like: '%' + req.query.search + '%', }, },
          {  date: { $like: '%' + req.query.search + '%', }, },
          {  message_id: { $like: '%' + req.query.search + '%', }, },
        ],
      },
      order: [
        ['internalDate', 'DESC'],
        ['from', 'ASC'],
        ['subject', 'ASC'],
        ['num_attach', 'DESC'],
      ],
      limit: limit,
      offset: offset,
    }).then(emails => {
      var threshold = offset+emails.length;
      res.render('email_section', {
        user: req.user,
        emails: emails,
        prevPage: 0,
        nextPage: 2,
        search: req.query.search,
        count: count,
        offset: offset+1,
        threshold: threshold,
      });
    });
  });
});

router.get('/:page', (req, res) => {
  if(req.params.page == 0) {
    res.redirect('/emails/1?search=');
    return;
  }
  // getMessages(req);
  // updateMessages(req);
  // listMessages(req);

  let limit = 25;
  let offset = 0;
  let pages = 0;
  let count = 0;
  Emails.findAndCountAll({
    where: {
      user_id: req.user.email,
      $or: [
        {  subject: { $like: '%' + req.query.search + '%', }, },
        {  to: { $like: '%' + req.query.search + '%', }, },
        {  from: { $like: '%' + req.query.search + '%', }, },
        {  body: { $like: '%' + req.query.search + '%', }, },
        {  date: { $like: '%' + req.query.search + '%', }, },
        {  message_id: { $like: '%' + req.query.search + '%', }, },
      ],
    },
  }).then(data => {
    count = data.count;
    let page = req.params.page;
    pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);
    Emails.findAll({
      where: {
        user_id: req.user.email,
        $or: [
          {  subject: { $like: '%' + req.query.search + '%', }, },
          {  to: { $like: '%' + req.query.search + '%', }, },
          {  from: { $like: '%' + req.query.search + '%', }, },
          {  body: { $like: '%' + req.query.search + '%', }, },
          {  date: { $like: '%' + req.query.search + '%', }, },
          {  message_id: { $like: '%' + req.query.search + '%', }, },
        ],
      },
      order: [
        ['internalDate', 'DESC'],
        ['from', 'ASC'],
        ['subject', 'ASC'],
        ['num_attach', 'DESC'],
      ],
      limit: limit,
      offset: offset,
    }).then(emails => {
      var p = parseInt(req.params.page);
      var threshold = offset+emails.length;
      res.render('email_section', {
        user: req.user,
        emails: emails,
        prevPage: p-1,
        nextPage: p+1,
        search: req.query.search,
        count: count,
        offset: offset+1,
        threshold: threshold,
      });
    });
  });
});

router.get('/f/fetch', (req, res) => {
  // getMessages(req);
  // updateMessages(req);
  listMessages(req);
  res.json("Complete");
});

router.get('/get/:id', (req, res) => {
  getMessage(req, res);
});


module.exports = router;
