const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/node_boilerplate',
    dialect: 'postgres',
    logging: (msg) => console.log(msg), // eslint-disable-line no-console
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/node_boilerplate_test',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};