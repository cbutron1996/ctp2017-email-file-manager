'use strict';

module.exports = (sequelize, DataTypes) => {
  var Emails = sequelize.define('Emails', {
    user_id: DataTypes.STRING,
    message_id: DataTypes.STRING,
    subject: DataTypes.STRING,
    to: DataTypes.STRING,
    from: DataTypes.STRING,
    body: DataTypes.STRING,
    num_attach: DataTypes.STRING,
    date: DataTypes.STRING,
  });
  return Emails;
};
