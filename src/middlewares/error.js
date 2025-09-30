const { ValidationError, DatabaseError } = require('sequelize');
const httpStatus = require('../utils/httpStatus');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode
      ? error.statusCode
      : error instanceof ValidationError || error instanceof DatabaseError
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  // Debug: log what we're passing to errorHandler
  if (config.env === 'development') {
    logger.debug(`Error converter: statusCode=${error.statusCode}, message=${error.message}`);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Debug: log what we received
  if (config.env === 'development') {
    logger.debug(`Error handler received: statusCode=${statusCode}, message=${message}, err.statusCode=${err.statusCode}`);
  }

  // Default to 500 if statusCode is undefined
  if (!statusCode) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    logger.warn(`Error handler: statusCode was undefined, defaulting to 500`);
  }

  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message: message || httpStatus[statusCode],
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
