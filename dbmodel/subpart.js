module.exports = function(sequelize, DataTypes) {
var Subpart = sequelize.define('Subpart', {
    attributs: DataTypes.DECIMAL,
    effect: DataTypes.DECIMAL,
    index: DataTypes.DECIMAL,
    text: DataTypes.TEXT,
    inline: DataTypes.BOOLEAN
}, {
    classMethods: {
        associate: function(models) {
            Subpart.belongsTo(models.Section)
        }
    }
});
 
  return Subpart;
}