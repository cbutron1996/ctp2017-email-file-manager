'use strict';

module.exports = (sequelize, DataTypes) => {
  var Attachments = sequelize.define('Attachments', {
    attachment_id: DataTypes.TEXT,
    message_id: DataTypes.STRING,
    user_id: DataTypes.STRING,
    file_name: DataTypes.STRING,
    file_type: DataTypes.STRING,
    part_index: DataTypes.INTEGER,
  });
  return Attachments;
};
