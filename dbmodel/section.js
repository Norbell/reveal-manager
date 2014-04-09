module.exports = function(sequelize, DataTypes) {
var Section = sequelize.define('Section', {
    attributs: DataTypes.STRING,
    effect: DataTypes.DECIMAL,
    index: DataTypes.DECIMAL,
    text: DataTypes.TEXT,
}, {
    classMethods: {
        associate: function(models) {
            Section.belongsTo(models.Presentation)
        }
    }
});
 
  return Section;
}