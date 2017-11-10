const express = require('express');
const models = require('../models');

const router = express.Router();

const Gmail = require('node-gmail-api');

router.get('/', (req, res) => {
  res.json({
    msg: "Successful GET to '/emails' route"
  });
});


module.exports = router;
