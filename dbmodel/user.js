module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    displayname: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    googleid: DataTypes.STRING,
    googletoken: DataTypes.STRING,
    facebookid: DataTypes.STRING,
    facebooktoken: DataTypes.STRING
  });
 
  return User;
}