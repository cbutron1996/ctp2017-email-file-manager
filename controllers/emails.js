const express = require('express');
const models = require('../models');

const Imap = require('imap')
const inspect = require('util').inspect;

const router = express.Router();

router.get('/', (req, res) => {

  var imap = new Imap({
    user: req.user.email,
    password: req.user.password,
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  });

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.once('ready', function() {
    openInbox(function(err, box) {
      if (err) throw err;
      //var f = imap.seq.fetch('1:3', {
      //  bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
      //  struct: true
      //});
      var f = imap.seq.fetch(box.messages.total + ':*', {
        bodies: '',
        struct: true
      });
      f.on('message', function(msg, seqno) {
        console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function(stream, info) {
          var buffer = '';
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');

            console.log('BUFFER', buffer);
          });
          stream.once('end', function() {
            console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
          });
        });
        msg.once('end', function() {
          console.log(prefix + 'Finished');
        });
      });
      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
        console.log('Done fetching all messages!');
        imap.end();
      });
      //res.json(f);
    });
  });

  imap.once('error', function(err) {
    console.log(err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });

  imap.connect();

  res.json({
    msg: "Successful GET to '/emails' route"
  });
});

router.post('/', (req, res) => {
  res.json({
    msg: "Successful POST to '/emails' route"
  });
});


module.exports = router;
