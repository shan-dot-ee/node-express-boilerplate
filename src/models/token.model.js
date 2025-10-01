const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');
const { tokenTypes } = require('../config/tokens');

const Token = sequelize.define(
  'Token',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM(tokenTypes.REFRESH, tokenTypes.RESET_PASSWORD, tokenTypes.VERIFY_EMAIL),
      allowNull: false,
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    blacklisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'tokens',
    timestamps: true,
    indexes: [
      {
        fields: ['token'],
      },
      {
        fields: ['userId'],
      },
    ],
  },
);

/**
 * @typedef Token
 */
module.exports = Token;
