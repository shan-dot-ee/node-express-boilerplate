const { Sequelize } = require('sequelize');
const config = require('../config/config');
const logger = require('../config/logger');

// Initialize Sequelize
const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Export sequelize instance for models to use
module.exports.sequelize = sequelize;

// Import models (they will use the sequelize instance)
const User = require('./user.model');
const Token = require('./token.model');

// Define associations
User.hasMany(Token, {
  foreignKey: 'userId',
  as: 'tokens',
  onDelete: 'CASCADE',
});

Token.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Export models
module.exports.User = User;
module.exports.Token = Token;