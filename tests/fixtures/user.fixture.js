const bcrypt = require('bcryptjs');
const faker = require('faker');
const User = require('../../src/models/user.model');

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const userOne = {
  name: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
  isEmailVerified: false,
};

const userTwo = {
  name: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
  isEmailVerified: false,
};

const admin = {
  name: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'admin',
  isEmailVerified: false,
};

const insertUsers = async (users) => {
  // First, clean up IDs from previous test runs
  users.forEach((user) => {
    delete user.id;
    delete user.createdAt;
    delete user.updatedAt;
  });

  const createdUsers = await User.bulkCreate(
    users.map((user) => ({ ...user, password: hashedPassword })),
    { validate: true, returning: true }
  );

  // Update the fixture objects with generated IDs and other fields
  users.forEach((user, index) => {
    const created = createdUsers[index];
    Object.assign(user, {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      isEmailVerified: created.isEmailVerified,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  return createdUsers;
};

module.exports = {
  userOne,
  userTwo,
  admin,
  insertUsers,
};
