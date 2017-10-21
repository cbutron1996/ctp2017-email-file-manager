const express = require('express');
const router = express.Router();


router.use('/alt', require('./alt'));
router.use('/', require('./home'));
router.use('/emails', require('./emails'));


module.exports = router;
