const { v4: uuidv4 } = require('uuid');
const faker = require('faker');
const { userService } = require('../../../src/services');
const { User } = require('../../../src/models');
const ApiError = require('../../../src/utils/ApiError');
const setupTestDB = require('../../utils/setupTestDB');
const { userOne, userTwo, admin, insertUsers } = require('../../fixtures/user.fixture');

setupTestDB();

describe('User service', () => {
  describe('createUser', () => {
    test('should create a user', async () => {
      const newUser = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'user',
      };

      const user = await userService.createUser(newUser);

      expect(user).toBeDefined();
      expect(user).toMatchObject({
        id: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
      expect(user.password).not.toBe(newUser.password); // Password should be hashed

      const dbUser = await User.findByPk(user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toBe(newUser.email);
    });

    test('should create an admin user', async () => {
      const newAdmin = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'admin',
      };

      const user = await userService.createUser(newAdmin);

      expect(user.role).toBe('admin');
    });

    test('should throw error if email is already taken', async () => {
      await insertUsers([userOne]);

      const newUser = {
        name: faker.name.findName(),
        email: userOne.email, // Same email
        password: 'password1',
        role: 'user',
      };

      await expect(userService.createUser(newUser)).rejects.toThrow(ApiError);
      await expect(userService.createUser(newUser)).rejects.toThrow('Email already taken');
    });

    test('should hash password before saving', async () => {
      const newUser = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'user',
      };

      const user = await userService.createUser(newUser);
      const dbUser = await User.findByPk(user.id);

      expect(dbUser.password).not.toBe('password1');
      expect(dbUser.password).toBeDefined();
    });
  });

  describe('queryUsers', () => {
    test('should return paginated users', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await userService.queryUsers({}, {});

      expect(result.results).toHaveLength(3);
      expect(result.totalResults).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    test('should filter users by role', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await userService.queryUsers({ role: 'admin' }, {});

      expect(result.results).toHaveLength(1);
      expect(result.results[0].role).toBe('admin');
    });

    test('should filter users by name', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await userService.queryUsers({ name: 'Alice User' }, {});

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Alice User');
    });

    test('should sort users', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await userService.queryUsers({}, { sortBy: 'name:asc' });

      expect(result.results[0].name).toBe('Alice User');
      expect(result.results[1].name).toBe('Bob User');
      expect(result.results[2].name).toBe('Charlie Admin');
    });

    test('should limit and paginate users', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await userService.queryUsers({}, { limit: 2, page: 1 });

      expect(result.results).toHaveLength(2);
      expect(result.totalPages).toBe(2);
      expect(result.totalResults).toBe(3);
    });

    test('should return empty array if no users match filter', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await userService.queryUsers({ email: 'nonexistent@example.com' }, {});

      expect(result.results).toEqual([]);
      expect(result.totalResults).toBe(0);
    });
  });

  describe('getUserById', () => {
    test('should return user if found', async () => {
      await insertUsers([userOne]);

      const user = await userService.getUserById(userOne.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(userOne.id);
      expect(user.email).toBe(userOne.email);
    });

    test('should return null if user not found', async () => {
      const user = await userService.getUserById(uuidv4());

      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    test('should return user if found', async () => {
      await insertUsers([userOne]);

      const user = await userService.getUserByEmail(userOne.email);

      expect(user).toBeDefined();
      expect(user.email).toBe(userOne.email);
    });

    test('should return null if user not found', async () => {
      const user = await userService.getUserByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('updateUserById', () => {
    test('should update user successfully', async () => {
      await insertUsers([userOne]);

      const updateBody = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const updatedUser = await userService.updateUserById(userOne.id, updateBody);

      expect(updatedUser.name).toBe(updateBody.name);
      expect(updatedUser.email).toBe(updateBody.email);

      const dbUser = await User.findByPk(userOne.id);
      expect(dbUser.name).toBe(updateBody.name);
      expect(dbUser.email).toBe(updateBody.email);
    });

    test('should update password and hash it', async () => {
      await insertUsers([userOne]);

      const updateBody = {
        password: 'newPassword1',
      };

      const updatedUser = await userService.updateUserById(userOne.id, updateBody);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(userOne.id);

      const dbUser = await User.findByPk(userOne.id);
      expect(dbUser.password).not.toBe('newPassword1');
      expect(dbUser.password).toBeDefined();
    });

    test('should throw error if user not found', async () => {
      const updateBody = { name: 'Updated Name' };

      await expect(userService.updateUserById(uuidv4(), updateBody)).rejects.toThrow(ApiError);
      await expect(userService.updateUserById(uuidv4(), updateBody)).rejects.toThrow('User not found');
    });

    test('should throw error if email already taken by another user', async () => {
      await insertUsers([userOne, userTwo]);

      const updateBody = { email: userTwo.email };

      await expect(userService.updateUserById(userOne.id, updateBody)).rejects.toThrow(ApiError);
      await expect(userService.updateUserById(userOne.id, updateBody)).rejects.toThrow('Email already taken');
    });

    test('should allow updating to same email', async () => {
      await insertUsers([userOne]);

      const updateBody = { email: userOne.email };

      const updatedUser = await userService.updateUserById(userOne.id, updateBody);

      expect(updatedUser.email).toBe(userOne.email);
    });

    test('should update only specified fields', async () => {
      await insertUsers([userOne]);

      const originalEmail = userOne.email;
      const updateBody = { name: 'New Name Only' };

      const updatedUser = await userService.updateUserById(userOne.id, updateBody);

      expect(updatedUser.name).toBe('New Name Only');
      expect(updatedUser.email).toBe(originalEmail);
    });
  });

  describe('deleteUserById', () => {
    test('should delete user successfully', async () => {
      await insertUsers([userOne]);

      await userService.deleteUserById(userOne.id);

      const dbUser = await User.findByPk(userOne.id);
      expect(dbUser).toBeNull();
    });

    test('should throw error if user not found', async () => {
      await expect(userService.deleteUserById(uuidv4())).rejects.toThrow(ApiError);
      await expect(userService.deleteUserById(uuidv4())).rejects.toThrow('User not found');
    });

    test('should return deleted user', async () => {
      await insertUsers([userOne]);

      const deletedUser = await userService.deleteUserById(userOne.id);

      expect(deletedUser).toBeDefined();
      expect(deletedUser.id).toBe(userOne.id);
    });
  });
});
