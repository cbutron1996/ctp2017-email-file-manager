const express = require('express');
const models = require('../models');
const Emails = models.Emails;
const router = express.Router();


router.get('/', (req, res) => {
  // Emails.findAll({
  //   where: { user_id: req.user.email }
  // }).then((emails) => {
  //     res.render('file_section', {
  //       user: req.user,
  //       emails: emails,
  //     })
  //   }
  // );
  res.render('login', {layout: 'loginLayout.handlebars'});
});


module.exports = router;
