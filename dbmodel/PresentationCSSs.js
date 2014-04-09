module.exports = function(sequelize, DataTypes) {
var PresentationCSS = sequelize.define('PresentationCSS', {
    css: DataTypes.STRING,
}, {
    classMethods: {
        associate: function(models) {
            PresentationCSS.belongsTo(models.Presentation)
        }
    }
});
 
  return PresentationCSS;
}