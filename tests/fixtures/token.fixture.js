const moment = require('moment');
const config = require('../../src/config/config');
const { tokenTypes } = require('../../src/config/tokens');
const tokenService = require('../../src/services/token.service');
const { userOne, admin } = require('./user.fixture');

// Generate access tokens dynamically after users are inserted
const getUserOneAccessToken = () => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  return tokenService.generateToken(userOne.id, accessTokenExpires, tokenTypes.ACCESS);
};

const getAdminAccessToken = () => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  return tokenService.generateToken(admin.id, accessTokenExpires, tokenTypes.ACCESS);
};

// For backward compatibility, expose as getters
Object.defineProperty(exports, 'userOneAccessToken', {
  get: getUserOneAccessToken,
});

Object.defineProperty(exports, 'adminAccessToken', {
  get: getAdminAccessToken,
});
