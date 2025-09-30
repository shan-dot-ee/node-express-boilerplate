const { sequelize } = require('../../src/models');

const setupTestDB = () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Drop and recreate tables
  });

  beforeEach(async () => {
    // Clear all tables
    const models = Object.values(sequelize.models);
    await Promise.all(models.map(async (model) => model.destroy({ where: {}, force: true })));
  });

  afterAll(async () => {
    await sequelize.close();
  });
};

module.exports = setupTestDB;
