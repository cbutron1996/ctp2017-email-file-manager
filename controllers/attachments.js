const express = require('express');
const models = require('../models');
const Emails = models.Emails;
const Attachments = models.Attachments;
const router = express.Router();
const google = require('googleapis');
const gmail = google.gmail('v1');

function getAllAttachments(req) {
  Emails.findAll({
    where: { user_id: req.user.email }
  }).then((emails) => {
      emails.forEach(function(email) {
        var messageId = email.message_id;
        gmail.users.messages.get({
          access_token: req.user.accessToken,
          userId: 'me',
          id: messageId,
        }, function(err, response) {
          if (err) return;
          getAttachments(req, response);
        });
      })
    }
  );
}

function getAttachments(req, message) {
  var parts = message.payload.parts;
  var headers = message.payload.headers;
  var date = headers.find(function(element) {
    return element.name === "Date";
  });
  if(!parts) return;
  parts.forEach(function(part) {
    if(part.filename && part.filename.length > 0) {
      var attachId = part.body.attachmentId;
      Attachments.findOne({
        where: {
          message_id: message.id,
          user_id: req.user.email,
          part_index: part.partId,
        }
      }).then(attachment => {
        if(attachment) {
          attachment.updateAttributes({
            message_id: message.id,
            user_id: req.user.email,
            attachment_id: attachId,
            file_name: part.filename,
            file_type: part.mimeType.substr(part.mimeType.indexOf("/")+1),
            part_index: part.partId,
          });
        } else {
          Attachments.create({
            message_id: message.id,
            user_id: req.user.email,
            attachment_id: attachId,
            file_name: part.filename,
            file_type: part.mimeType.substr(part.mimeType.indexOf("/")+1),
            part_index: part.partId,
          });
        }
      });
    }
  });
}

function getAttachment(req, res) {
  gmail.users.messages.attachments.get({
    access_token: req.user.accessToken,
    userId: 'me',
    messageId: req.params.id,
    id: req.params.aid,
  }, function(err, response) {
    if (err) {
      res.json(err);
      return;
    }
    res.header('filename', req.params.filename);
    const dl = Buffer.from(response.data.toString('utf-8'), 'base64');
    res.end(dl);
  });
}

function getDownload(req, res) {
  gmail.users.messages.attachments.get({
    access_token: req.user.accessToken,
    userId: 'me',
    messageId: req.params.id,
    id: req.params.aid,
  }, function(err, response) {
    if (err) {
      res.json(err);
      return;
    }
    res.header('filename', req.params.filename);
    const dl = Buffer.from(response.data.toString('utf-8'), 'base64');
    res.send(dl);
  });
}

router.get('/', (req, res) => {
  if(req.query.search == null) {
    res.redirect('/attachments?search=');
    return;
  }
  getAllAttachments(req);

  let limit = 25;
  let offset = 0;
  let count = 0;
  Attachments.findAndCountAll({
    where: {
      user_id: req.user.email,
      $or: [
        {  message_id: { $like: '%' + req.query.search + '%', }, },
        {  file_name: { $like: '%' + req.query.search + '%', }, },
        {  file_type: { $like: '%' + req.query.search + '%', }, },
      ],
    },
  }).then(data => {
    count = data.count;
    let page = 1;
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);
    Attachments.findAll({
      where: {
        user_id: req.user.email,
        $or: [
          {  message_id: { $like: '%' + req.query.search + '%', }, },
          {  file_name: { $like: '%' + req.query.search + '%', }, },
          {  file_type: { $like: '%' + req.query.search + '%', }, },
        ],
      },
      order: [
        ['file_type', 'ASC'],
        ['file_name', 'ASC'],
      ],
      limit: limit,
      offset: offset,
    }).then((attachments) => {
      var threshold = offset+attachments.length;
      res.render('file_section', {
        user: req.user,
        attachments: attachments,
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
  if(req.query.search == null) {
    res.redirect('/attachments/1?search=');
    return;
  }
  // getAllAttachments(req);

  let limit = 25;
  let offset = 0;
  let count = 0;
  Attachments.findAndCountAll({
    where: {
      user_id: req.user.email,
      $or: [
        {  message_id: { $like: '%' + req.query.search + '%', }, },
        {  file_name: { $like: '%' + req.query.search + '%', }, },
        {  file_type: { $like: '%' + req.query.search + '%', }, },
      ],
    },
  }).then(data => {
    count = data.count;
    let page = req.params.page;
    let pages = Math.ceil(data.count / limit);
    offset = limit * (page - 1);
    Attachments.findAll({
      where: {
        user_id: req.user.email,
        $or: [
          {  message_id: { $like: '%' + req.query.search + '%', }, },
          {  file_name: { $like: '%' + req.query.search + '%', }, },
          {  file_type: { $like: '%' + req.query.search + '%', }, },
        ],
      },
      order: [
        ['file_type', 'ASC'],
        ['file_name', 'ASC'],
      ],
      limit: limit,
      offset: offset,
    }).then((attachments) => {
      var p = parseInt(req.params.page);
      var threshold = offset+attachments.length;
      res.render('file_section', {
        user: req.user,
        attachments: attachments,
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

router.get('/fetch', (req, res) => {
  getAllAttachments(req);
  res.json("Complete");
});

router.get('/:id/:aid/:filename', (req, res) => {
  getAttachment(req, res);
});

router.get('/:id/:aid/download/:filename', (req, res) => {
  getDownload(req, res);
});


module.exports = router;
