const express = require('express');
const models = require('../models');

const router = express.Router();

const Gmail = require('node-gmail-api');

router.get('/', (req, res) => {
  var gmail = new Gmail(req.user.accessToken);
  var s = gmail.messages('label:inbox', {max: 10});
  var buffer = '';
  s.on('data', function (d) {
    console.log(d.snippet)
    buffer = d.snippet;
  });
  res.json({
    msg: buffer
  });
});


module.exports = router;
