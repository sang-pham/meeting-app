const { DataTypes, Model } = require('sequelize')
const User = require('./user')
const Group = require('./group')
const sequelize = require('./index')

class Meeting extends Model {
}

Meeting.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  time: {
    type: DataTypes.INTEGER,
  }
}, {
  sequelize,
  modelName: 'Meeting'
})

module.exports = Meeting