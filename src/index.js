const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { sequelize } = require('./models');

let server;

// Test database connection and start server
sequelize
  .authenticate()
  .then(() => {
    logger.info('Connected to PostgreSQL');
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  })
  .catch((error) => {
    logger.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      sequelize.close().then(() => {
        logger.info('Database connection closed');
        process.exit(1);
      });
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});