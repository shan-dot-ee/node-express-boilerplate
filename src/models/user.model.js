const { DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('./index');
const { roles } = require('../config/roles');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        isLowercase: true,
      },
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [8, 255],
        isValidPassword(value) {
          if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
            throw new Error('Password must contain at least one letter and one number');
          }
        },
      },
    },
    role: {
      type: DataTypes.ENUM(...roles),
      defaultValue: 'user',
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          // eslint-disable-next-line no-param-reassign
          user.password = await bcrypt.hash(user.password, 8);
        }
      },
    },
  }
);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {UUID} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
User.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({
    where: {
      email,
      ...(excludeUserId && { id: { [Op.ne]: excludeUserId } }),
    },
  });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
User.prototype.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

/**
 * Transform user object for JSON response (exclude password)
 */
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

/**
 * @typedef User
 */
module.exports = User;