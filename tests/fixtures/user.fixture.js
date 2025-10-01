const bcrypt = require('bcryptjs');
const User = require('../../src/models/user.model');

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

// Use deterministic data for predictable sorting and pagination tests
const userOne = {
  name: 'Alice User',
  email: 'alice.user@example.com',
  password,
  role: 'user',
  isEmailVerified: false,
};

const userTwo = {
  name: 'Bob User',
  email: 'bob.user@example.com',
  password,
  role: 'user',
  isEmailVerified: false,
};

const admin = {
  name: 'Charlie Admin',
  email: 'charlie.admin@example.com',
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

  // Insert users sequentially to ensure different createdAt timestamps
  const createdUsers = [];
  for (const user of users) {
    const created = await User.create({ ...user, password: hashedPassword });
    createdUsers.push(created);

    // Small delay to ensure different timestamps (only in test environment)
    // eslint-disable-next-line no-undef
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

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
