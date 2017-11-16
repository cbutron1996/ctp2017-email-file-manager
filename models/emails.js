'use strict';

module.exports = (sequelize, DataTypes) => {
  var Emails = sequelize.define('Emails', {
    message_id: DataTypes.STRING,
    subject: DataTypes.STRING,
    to: DataTypes.STRING,
    from: DataTypes.STRING,
    body: DataTypes.TEXT,
    date: DataTypes.STRING,
    num_attach: DataTypes.INTEGER,
    user_id: DataTypes.STRING,
  });
  return Emails;
};
