const express = require('express');
const models = require('../models');
const Emails = models.Emails;
const Attachments = models.Attachments;
const router = express.Router();
const google = require('googleapis');
const gmail = google.gmail('v1');
const atob = require('atob');
const fs = require('fs');

function getAttachments(req, message) {
  var parts = message.payload.parts;
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

function sortByFileName(attachments) {
  for(var i = 0; i < attachments.length; i++) {
    for(var j = 0; j < attachments.length; j++) {
      var attachment1 = attachments[i];
      var attachment2 = attachments[j];
      if(attachment1.file_name < attachment2.file_name) {
        var temp = attachments[i];
        attachments[i] = attachments[j];
        attachments[j] = temp;
      }
    }
  }
  return attachments;
}

function sortByFileType(attachments) {
  for(var i = 0; i < attachments.length; i++) {
    for(var j = 0; j < attachments.length; j++) {
      var attachment1 = attachments[i];
      var attachment2 = attachments[j];
      if(attachment1.file_type < attachment2.file_type) {
        var temp = attachments[i];
        attachments[i] = attachments[j];
        attachments[j] = temp;
      }
    }
  }
  return attachments;
}

router.get('/', (req, res) => {
  if(req.query.search == null || req.query.search == '$ALL') {
    res.redirect('/attachments?search=');
    return;
  }
  Attachments.findAll({
    where: {
      user_id: req.user.email,
      $or: [
        {  file_name: { $like: '%' + req.query.search + '%', }, },
        {  file_type: { $like: '%' + req.query.search + '%', }, },
      ],
    }
  }).then((attachments) => {
      attachments = sortByFileType(attachments);
      res.render('file_section', {
        user: req.user,
        attachments: attachments,
      })
    }
  );
});

router.get('/fetch', (req, res) => {
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
});

router.get('/:id/:aid/:filename', (req, res) => {
  getAttachment(req, res);
});

router.get('/:id/:aid/download/:filename', (req, res) => {
  getDownload(req, res);
});


module.exports = router;
