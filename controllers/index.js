const express = require('express');
const router = express.Router();


router.use('/', require('./home'));
router.use('/emails', require('./emails'));
router.use('/attachments', require('./attachments'));
router.use('/login', require('./login'));
router.use('/signup', require('./signup'));
router.use('/profile', require('./profile'));


module.exports = router;
