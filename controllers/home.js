const express = require('express');
const models = require('../models');

const router = express.Router();


router.get('/', (req, res) => {
  res.render('file_section', { user: req.user })
});


module.exports = router;
