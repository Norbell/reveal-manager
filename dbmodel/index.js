var fs        = require('fs'),
    config    = require('../config/config')
  , path      = require('path')
  , Sequelize = require('sequelize')
  , lodash    = require('lodash')
  , sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
                                host: config.mysql.host,
                            })
  , db        = {}
 
fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })
 
Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})
 
module.exports = lodash.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db)