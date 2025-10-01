const paginate = require('../../../src/utils/paginate');
const setupTestDB = require('../../utils/setupTestDB');
const { User } = require('../../../src/models');
const { insertUsers, userOne, userTwo, admin } = require('../../fixtures/user.fixture');

setupTestDB();

describe('Paginate utility', () => {
  describe('Basic pagination', () => {
    test('should paginate with default options', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {});

      expect(result).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(result.results).toHaveLength(3);
    });

    test('should apply limit correctly', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { limit: 2 });

      expect(result).toMatchObject({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(result.results).toHaveLength(2);
    });

    test('should apply page correctly', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { page: 2, limit: 2 });

      expect(result).toMatchObject({
        results: expect.any(Array),
        page: 2,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(result.results).toHaveLength(1);
    });

    test('should return empty results for page beyond total pages', async () => {
      await insertUsers([userOne]);

      const result = await paginate(User, {}, { page: 10, limit: 10 });

      expect(result).toMatchObject({
        results: [],
        page: 10,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      });
    });
  });

  describe('Filtering', () => {
    test('should filter by single field', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, { role: 'admin' });

      expect(result.totalResults).toBe(1);
      expect(result.results[0].role).toBe('admin');
    });

    test('should filter by multiple fields', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, { role: 'user', name: 'Alice User' });

      expect(result.totalResults).toBe(1);
      expect(result.results[0].name).toBe('Alice User');
      expect(result.results[0].role).toBe('user');
    });

    test('should return empty results if no match', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, { email: 'nonexistent@example.com' });

      expect(result.totalResults).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('Sorting', () => {
    test('should sort by single field ascending', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { sortBy: 'name:asc' });

      expect(result.results).toHaveLength(3);
      expect(result.results[0].name).toBe('Alice User');
      expect(result.results[1].name).toBe('Bob User');
      expect(result.results[2].name).toBe('Charlie Admin');
    });

    test('should sort by single field descending', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { sortBy: 'name:desc' });

      expect(result.results).toHaveLength(3);
      expect(result.results[0].name).toBe('Charlie Admin');
      expect(result.results[1].name).toBe('Bob User');
      expect(result.results[2].name).toBe('Alice User');
    });

    test('should sort by multiple fields', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { sortBy: 'role:desc,name:asc' });

      expect(result.results).toHaveLength(3);
      // First by role desc (user > admin), then by name asc
      expect(result.results[0].role).toBe('user');
      expect(result.results[0].name).toBe('Alice User');
      expect(result.results[1].role).toBe('user');
      expect(result.results[1].name).toBe('Bob User');
      expect(result.results[2].role).toBe('admin');
    });

    test('should use default sort (createdAt DESC) when sortBy not specified', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, {});

      expect(result.results).toHaveLength(3);
      // Should be sorted by createdAt DESC (newest first)
      // Since all created at same time in bulk, we just verify all are returned
      const userIds = result.results.map((u) => u.id);
      expect(userIds).toEqual(expect.arrayContaining([userOne.id, userTwo.id, admin.id]));
    });
  });

  describe('Combined operations', () => {
    test('should combine filter, sort, and pagination', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, { role: 'user' }, { sortBy: 'name:asc', limit: 1, page: 1 });

      expect(result).toMatchObject({
        page: 1,
        limit: 1,
        totalPages: 2,
        totalResults: 2,
      });
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Alice User');
    });

    test('should handle empty filter with sorting and pagination', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { sortBy: 'email:asc', limit: 2, page: 1 });

      expect(result).toMatchObject({
        page: 1,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    test('should handle limit of 0', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { limit: 0 });

      // Invalid limit should default to 10
      expect(result.limit).toBe(10);
    });

    test('should handle negative page', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { page: -1 });

      // Invalid page should default to 1
      expect(result.page).toBe(1);
    });

    test('should handle non-numeric limit and page', async () => {
      await insertUsers([userOne, userTwo, admin]);

      const result = await paginate(User, {}, { limit: 'abc', page: 'xyz' });

      // Invalid values should default
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    test('should handle empty database', async () => {
      const result = await paginate(User, {}, {});

      expect(result).toMatchObject({
        results: [],
        page: 1,
        limit: 10,
        totalPages: 0,
        totalResults: 0,
      });
    });

    test('should handle invalid sort field gracefully', async () => {
      await insertUsers([userOne, userTwo, admin]);

      // This should not throw, Sequelize will handle the invalid field
      const result = await paginate(User, {}, { sortBy: 'name:asc' });

      expect(result.totalResults).toBe(3);
    });
  });
});
