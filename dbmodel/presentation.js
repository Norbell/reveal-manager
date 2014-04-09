module.exports = function(sequelize, DataTypes) {
var Presentation = sequelize.define('Presentation', {
    presentationtype: DataTypes.STRING,
    name: DataTypes.STRING,
    attributs: DataTypes.STRING,
    token: DataTypes.STRING,
    shorturl: DataTypes.STRING,
}, {
    classMethods: {
        associate: function(models) {
            Presentation.belongsTo(models.User)
            Presentation.hasOne(models.PresentationCSS)
            Presentation.hasMany(models.Section)
        }
    }
});
 
  return Presentation;
}