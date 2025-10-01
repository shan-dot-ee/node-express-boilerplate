# Test Suite Documentation

## Overview

This Node.js/Express boilerplate uses **Jest** as its testing framework with **Supertest** for HTTP assertions and **Sequelize** with PostgreSQL for database operations. The test suite includes both integration and unit tests.

## Test Structure

```
tests/
├── fixtures/           # Test data and helper functions
│   ├── user.fixture.js    # User test data and insertion helpers
│   └── token.fixture.js   # JWT token generation for tests
├── integration/        # API endpoint integration tests
│   ├── auth.test.js       # Authentication routes testing
│   ├── user.test.js       # User CRUD routes testing
│   └── docs.test.js       # API documentation route testing
├── unit/              # Unit tests for isolated components
│   ├── models/
│   │   └── user.model.test.js     # User model validation tests
│   └── middlewares/
│       └── error.test.js          # Error handling middleware tests
└── utils/             # Test utilities
    └── setupTestDB.js     # Database setup and teardown
```

## What is Tested

### Integration Tests

#### Authentication Routes (`tests/integration/auth.test.js`)
- **POST /v1/auth/register** - User registration with validation
  - Successful registration
  - Email validation (invalid format, duplicate)
  - Password validation (length, complexity)

- **POST /v1/auth/login** - User authentication
  - Successful login
  - Invalid credentials handling
  - Non-existent user handling

- **POST /v1/auth/logout** - Session termination
  - Valid refresh token logout
  - Missing/invalid token handling
  - Blacklisted token handling

- **POST /v1/auth/refresh-tokens** - Token refresh
  - Valid token refresh
  - Expired/invalid token handling
  - Blacklisted token handling

- **POST /v1/auth/forgot-password** - Password reset request
  - Email sending
  - Non-existent email handling

- **POST /v1/auth/reset-password** - Password reset
  - Successful password reset
  - Token validation
  - Password validation

- **POST /v1/auth/send-verification-email** - Email verification request
  - Authenticated user email verification
  - Missing authentication handling

- **POST /v1/auth/verify-email** - Email verification
  - Successful verification
  - Token validation and expiration

- **Auth Middleware** - JWT authentication and authorization
  - Valid/invalid token handling
  - Token type validation
  - Role-based permissions
  - User access control

#### User Routes (`tests/integration/user.test.js`)
- **POST /v1/users** - Create user (admin only)
  - Successful user creation
  - Admin/user role creation
  - Authentication and authorization
  - Email and password validation

- **GET /v1/users** - List users with pagination (admin only)
  - Default query options
  - Filtering (by name, role)
  - Sorting (single and multiple fields)
  - Pagination (limit, page)

- **GET /v1/users/:userId** - Get single user
  - Successful retrieval
  - Own profile access
  - Admin access to other users
  - Invalid user ID handling

- **DELETE /v1/users/:userId** - Delete user
  - Self-deletion
  - Admin deletion of other users
  - Authorization checks
  - Non-existent user handling

- **PATCH /v1/users/:userId** - Update user
  - Successful update
  - Self-update
  - Admin update of other users
  - Email uniqueness validation
  - Password validation

#### Documentation Routes (`tests/integration/docs.test.js`)
- **GET /v1/docs** - Swagger documentation access
  - Production environment blocking

### Unit Tests

#### User Model (`tests/unit/models/user.model.test.js`)
- **Validation**
  - Valid user data
  - Email format validation
  - Password length validation (min 8 characters)
  - Password complexity (letters and numbers required)
  - Role validation (user/admin)

- **toJSON() Method**
  - Password exclusion from JSON output

#### Error Middleware (`tests/unit/middlewares/error.test.js`)
- **errorConverter**
  - ApiError passthrough
  - Error to ApiError conversion
  - Status code handling
  - Sequelize ValidationError conversion
  - Default error handling

- **errorHandler**
  - Proper error response formatting
  - Development mode stack traces
  - Production mode error masking
  - Operational vs non-operational errors

## How to Run Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run coverage
```

### Jest Options

The test scripts use these flags:
- `-i` - Run tests serially (not in parallel)
- `--colors` - Colorize output
- `--verbose` - Display individual test results
- `--detectOpenHandles` - Detect async operations that prevent Jest from exiting

### Environment

Tests run in `NODE_ENV=test` (configured in [jest.config.js](jest.config.js:3-5))

### Database Setup

Before running tests, ensure:
1. PostgreSQL is running
2. Test database exists (or can be created)
3. Environment variables are set (see `.env.example`)

The [setupTestDB.js](tests/utils/setupTestDB.js) utility:
- Connects to the database before all tests
- Drops and recreates tables before all tests (`sequelize.sync({ force: true })`)
- Clears all tables before each test
- Closes database connection after all tests

## Coverage

### Current Coverage Areas

**Well Covered:**
- ✅ Authentication flows (register, login, logout, token refresh)
- ✅ Password reset and email verification
- ✅ User CRUD operations
- ✅ Authorization and permissions (admin vs user)
- ✅ Input validation (email, password, roles)
- ✅ Pagination, filtering, and sorting
- ✅ Error handling middleware
- ✅ User model validation

**Not Covered (Potential Test Gaps):**
- ⚠️ Token service unit tests
- ⚠️ Email service (only mocked in integration tests)
- ⚠️ Rate limiting middleware
- ⚠️ Validation middleware
- ⚠️ Pagination utility functions
- ⚠️ Custom validation functions
- ⚠️ Morgan/Logger configuration
- ⚠️ Passport JWT strategy

### Coverage Configuration

From [jest.config.js](jest.config.js:7):
- Ignores: `node_modules`, `src/config`, `src/app.js`, `tests`
- Reporters: `text`, `lcov`, `clover`, `html`

## Writing New Tests - Guide for Agents

### Prerequisites

Before writing tests, understand:
1. **Test Type**: Is this an integration test (API routes) or unit test (isolated function/class)?
2. **Dependencies**: What fixtures, mocks, or database setup is needed?
3. **Existing Patterns**: Review similar existing tests for consistency

### Step 1: Determine Test Location

```
Integration Test (API routes) → tests/integration/[feature].test.js
Unit Test (Models)           → tests/unit/models/[model].test.js
Unit Test (Services)         → tests/unit/services/[service].test.js
Unit Test (Middleware)       → tests/unit/middlewares/[middleware].test.js
Unit Test (Utils)            → tests/unit/utils/[utility].test.js
```

### Step 2: Set Up Test File Structure

#### For Integration Tests

```javascript
const request = require('supertest');
const faker = require('faker');
const httpStatus = require('../../src/utils/httpStatus');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { User } = require('../../src/models'); // Import needed models
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');

setupTestDB(); // IMPORTANT: Call this to set up database hooks

describe('[Feature] routes', () => {
  describe('[HTTP_METHOD] /v1/[endpoint]', () => {
    // Tests go here
  });
});
```

#### For Unit Tests

```javascript
const httpMocks = require('node-mocks-http'); // For mocking req/res
const { [Module] } = require('../../src/[path]/[module]');
// Import other dependencies

describe('[Module] module', () => {
  describe('[Function/Method] name', () => {
    // Tests go here
  });
});
```

### Step 3: Create Fixtures (If Needed)

If testing requires consistent test data, add to existing fixtures or create new ones:

**Example: Adding a new user fixture to `tests/fixtures/user.fixture.js`**

```javascript
const userThree = {
  id: uuidv4(),
  name: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password, // Use existing password constant
  role: 'user',
  isEmailVerified: true, // Different from other fixtures
};

module.exports = {
  userOne,
  userTwo,
  userThree, // Export new fixture
  admin,
  insertUsers,
};
```

**Example: Creating a new fixture file `tests/fixtures/post.fixture.js`**

```javascript
const { v4: uuidv4 } = require('uuid');
const faker = require('faker');
const Post = require('../../src/models/post.model');
const { userOne } = require('./user.fixture');

const postOne = {
  id: uuidv4(),
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(),
  userId: userOne.id,
};

const postTwo = {
  id: uuidv4(),
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(),
  userId: userOne.id,
};

const insertPosts = async (posts) => {
  await Post.bulkCreate(posts, { validate: true });
};

module.exports = {
  postOne,
  postTwo,
  insertPosts,
};
```

### Step 4: Write Test Cases

#### Integration Test Example

```javascript
describe('POST /v1/posts', () => {
  let newPost;

  beforeEach(() => {
    // Reset test data before each test
    newPost = {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(),
    };
  });

  test('should return 201 and successfully create post if data is ok', async () => {
    await insertUsers([userOne]); // Set up database state

    const res = await request(app)
      .post('/v1/posts')
      .set('Authorization', `Bearer ${userOneAccessToken}`) // Authenticate
      .send(newPost)
      .expect(httpStatus.CREATED);

    // Assert response body
    expect(res.body).toMatchObject({
      id: expect.anything(),
      title: newPost.title,
      content: newPost.content,
      userId: userOne.id,
    });

    // Assert database state
    const dbPost = await Post.findByPk(res.body.id);
    expect(dbPost).toBeDefined();
    expect(dbPost).toMatchObject({
      title: newPost.title,
      content: newPost.content,
    });
  });

  test('should return 401 error if access token is missing', async () => {
    await request(app)
      .post('/v1/posts')
      .send(newPost)
      .expect(httpStatus.UNAUTHORIZED);
  });

  test('should return 400 error if title is missing', async () => {
    await insertUsers([userOne]);
    delete newPost.title;

    await request(app)
      .post('/v1/posts')
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .send(newPost)
      .expect(httpStatus.BAD_REQUEST);
  });
});
```

#### Unit Test Example (Model)

```javascript
describe('Post model', () => {
  describe('Post validation', () => {
    let newPost;

    beforeEach(() => {
      newPost = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(),
        userId: uuidv4(),
      };
    });

    test('should correctly validate a valid post', async () => {
      await expect(new Post(newPost).validate()).resolves.toBeUndefined();
    });

    test('should throw validation error if title is empty', async () => {
      newPost.title = '';
      await expect(new Post(newPost).validate()).rejects.toThrow();
    });

    test('should throw validation error if title exceeds max length', async () => {
      newPost.title = 'a'.repeat(256); // Assuming max is 255
      await expect(new Post(newPost).validate()).rejects.toThrow();
    });
  });
});
```

#### Unit Test Example (Service)

```javascript
const { postService } = require('../../src/services');
const { Post, User } = require('../../src/models');
const ApiError = require('../../src/utils/ApiError');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, insertUsers } = require('../fixtures/user.fixture');
const { postOne, insertPosts } = require('../fixtures/post.fixture');

setupTestDB();

describe('Post service', () => {
  describe('createPost', () => {
    test('should create a post', async () => {
      await insertUsers([userOne]);
      const postData = {
        title: 'Test Post',
        content: 'Test Content',
        userId: userOne.id,
      };

      const post = await postService.createPost(postData);

      expect(post).toMatchObject(postData);
      const dbPost = await Post.findByPk(post.id);
      expect(dbPost).toBeDefined();
    });

    test('should throw error if user does not exist', async () => {
      const postData = {
        title: 'Test Post',
        content: 'Test Content',
        userId: uuidv4(), // Non-existent user
      };

      await expect(postService.createPost(postData)).rejects.toThrow(ApiError);
    });
  });

  describe('getPostById', () => {
    test('should return post if found', async () => {
      await insertUsers([userOne]);
      await insertPosts([postOne]);

      const post = await postService.getPostById(postOne.id);

      expect(post).toBeDefined();
      expect(post.id).toBe(postOne.id);
    });

    test('should return null if post not found', async () => {
      const post = await postService.getPostById(uuidv4());
      expect(post).toBeNull();
    });
  });
});
```

#### Unit Test Example (Middleware)

```javascript
const httpMocks = require('node-mocks-http');
const authMiddleware = require('../../src/middlewares/auth');
const { User } = require('../../src/models');
const ApiError = require('../../src/utils/ApiError');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

describe('Auth middleware', () => {
  test('should call next with no errors if access token is valid', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` }
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await authMiddleware()(req, res, next);

    expect(next).toHaveBeenCalledWith(); // Called without error
    expect(req.user.id).toEqual(userOne.id);
  });

  test('should call next with unauthorized error if token is missing', async () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await authMiddleware()(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED })
    );
  });
});
```

### Step 5: Testing Patterns and Best Practices

#### Use Descriptive Test Names

```javascript
// ❌ Bad
test('test user creation', async () => {});

// ✅ Good
test('should return 201 and successfully create user if request data is ok', async () => {});
```

#### Test Both Success and Failure Cases

```javascript
describe('POST /v1/posts', () => {
  test('should return 201 and create post if data is valid', async () => {
    // Success case
  });

  test('should return 400 if title is missing', async () => {
    // Validation failure
  });

  test('should return 401 if not authenticated', async () => {
    // Auth failure
  });

  test('should return 403 if user lacks permissions', async () => {
    // Authorization failure
  });
});
```

#### Use beforeEach for Test Data Setup

```javascript
describe('Feature tests', () => {
  let testData;

  beforeEach(() => {
    // Reset test data before each test to avoid pollution
    testData = {
      field: 'value'
    };
  });

  test('test 1', async () => {
    // Use testData
  });

  test('test 2', async () => {
    // Each test gets fresh testData
  });
});
```

#### Mock External Services

```javascript
// Mock email service to avoid sending real emails
beforeEach(() => {
  jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
});

test('should send email', async () => {
  const sendEmailSpy = jest.spyOn(emailService, 'sendResetPasswordEmail');

  // Trigger action that sends email
  await request(app)
    .post('/v1/auth/forgot-password')
    .send({ email: userOne.email })
    .expect(httpStatus.NO_CONTENT);

  // Verify email was sent
  expect(sendEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
});
```

#### Assert Both Response and Database State

```javascript
test('should update user', async () => {
  await insertUsers([userOne]);

  const updateBody = { name: 'New Name' };
  const res = await request(app)
    .patch(`/v1/users/${userOne.id}`)
    .set('Authorization', `Bearer ${userOneAccessToken}`)
    .send(updateBody)
    .expect(httpStatus.OK);

  // Assert response
  expect(res.body.name).toBe('New Name');

  // Assert database state
  const dbUser = await User.findByPk(userOne.id);
  expect(dbUser.name).toBe('New Name');
});
```

#### Use expect.anything() for Dynamic Values

```javascript
expect(res.body).toEqual({
  id: expect.anything(),           // UUID, unpredictable
  createdAt: expect.anything(),    // Timestamp, unpredictable
  name: 'Expected Name',            // Known value
  email: 'expected@email.com',     // Known value
});
```

#### Test Edge Cases

```javascript
describe('GET /v1/users', () => {
  test('should return empty array if no users exist', async () => {
    const res = await request(app)
      .get('/v1/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(httpStatus.OK);

    expect(res.body.results).toEqual([]);
    expect(res.body.totalResults).toBe(0);
  });

  test('should handle pagination edge case (last page with 1 item)', async () => {
    await insertUsers([userOne, userTwo, userThree]);

    const res = await request(app)
      .get('/v1/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .query({ page: 2, limit: 2 })
      .expect(httpStatus.OK);

    expect(res.body.results).toHaveLength(1);
    expect(res.body.page).toBe(2);
  });
});
```

### Step 6: Handling Authentication in Tests

#### Testing Unauthenticated Routes

```javascript
test('should return 200 for public endpoint', async () => {
  await request(app)
    .get('/v1/public/info')
    .expect(httpStatus.OK);
});
```

#### Testing Authenticated Routes (User)

```javascript
test('should return 200 if user is authenticated', async () => {
  await insertUsers([userOne]);

  await request(app)
    .get('/v1/profile')
    .set('Authorization', `Bearer ${userOneAccessToken}`)
    .expect(httpStatus.OK);
});
```

#### Testing Admin-Only Routes

```javascript
test('should return 200 if admin is accessing admin route', async () => {
  await insertUsers([admin]);

  await request(app)
    .get('/v1/admin/stats')
    .set('Authorization', `Bearer ${adminAccessToken}`)
    .expect(httpStatus.OK);
});

test('should return 403 if regular user tries to access admin route', async () => {
  await insertUsers([userOne]);

  await request(app)
    .get('/v1/admin/stats')
    .set('Authorization', `Bearer ${userOneAccessToken}`)
    .expect(httpStatus.FORBIDDEN);
});
```

#### Testing Own Resource Access

```javascript
test('should allow user to access own resource', async () => {
  await insertUsers([userOne]);

  await request(app)
    .get(`/v1/users/${userOne.id}`)
    .set('Authorization', `Bearer ${userOneAccessToken}`)
    .expect(httpStatus.OK);
});

test('should forbid user from accessing another user resource', async () => {
  await insertUsers([userOne, userTwo]);

  await request(app)
    .get(`/v1/users/${userTwo.id}`)
    .set('Authorization', `Bearer ${userOneAccessToken}`)
    .expect(httpStatus.FORBIDDEN);
});
```

### Step 7: Common Jest Matchers

```javascript
// Equality
expect(value).toBe(exactValue);           // Strict equality (===)
expect(value).toEqual(expectedObject);    // Deep equality
expect(object).toMatchObject({ a: 1 });   // Partial object match

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeLessThanOrEqual(5);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).toContainEqual({ a: 1 });

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(ErrorType);

// Function calls (mocks/spies)
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(2);

// Any type
expect.anything()       // Any value except null/undefined
expect.any(Constructor) // Any instance of type
expect.arrayContaining([...])
expect.objectContaining({...})
```

### Step 8: Debugging Test Failures

#### Enable Verbose Logging

```javascript
// Add console.log to inspect values
test('debug test', async () => {
  const res = await request(app).get('/v1/users');
  console.log('Response:', res.body);
  console.log('Status:', res.status);
});
```

#### Use --detectOpenHandles

```bash
npm test -- --detectOpenHandles
```

This helps identify async operations preventing Jest from exiting.

#### Isolate Failing Tests

```javascript
// Run only this test
test.only('should do something', async () => {
  // Test code
});

// Skip this test
test.skip('should do something else', async () => {
  // Test code
});
```

#### Check Database State

```javascript
test('debug database', async () => {
  await insertUsers([userOne]);

  // Check what's actually in the database
  const users = await User.findAll();
  console.log('Users in DB:', users.map(u => u.toJSON()));
});
```

## Testing Checklist for Agents

When writing new tests, verify:

- [ ] Test file is in correct location (`integration/` or `unit/`)
- [ ] Required imports are present (supertest, models, fixtures, etc.)
- [ ] `setupTestDB()` is called for database tests
- [ ] Test describes what it tests clearly
- [ ] Both success and failure cases are covered
- [ ] Database state is set up with fixtures
- [ ] Authentication/authorization is tested appropriately
- [ ] Response status codes are asserted
- [ ] Response bodies are asserted
- [ ] Database state changes are verified (for integration tests)
- [ ] Edge cases are considered
- [ ] External services are mocked
- [ ] Test data is reset in `beforeEach` hooks
- [ ] Tests are independent (can run in any order)
- [ ] Tests clean up after themselves (handled by `setupTestDB`)

## Common Errors and Solutions

### Error: "Jest encountered an unexpected token"

**Cause**: Module incompatibility (ESM vs CommonJS)

**Solution**: Update jest.config.js to transform the module:

```javascript
transformIgnorePatterns: [
  'node_modules/(?!(uuid)/)', // Transform uuid module
],
```

### Error: "Database connection timeout"

**Cause**: Database not running or incorrect credentials

**Solution**:
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in environment
3. Verify test database exists

### Error: "Unable to acquire connection from pool"

**Cause**: Database connections not properly closed

**Solution**: Ensure `setupTestDB()` is called and `afterAll` closes connections

### Error: "Validation error: email must be unique"

**Cause**: Previous test data not cleaned up

**Solution**: `setupTestDB()` should clear tables in `beforeEach`. Verify it's working correctly.

### Error: "jest did not exit one second after test run"

**Cause**: Open handles (database connections, timers, listeners)

**Solution**:
1. Run with `--detectOpenHandles` to find the source
2. Ensure database connections close in `afterAll`
3. Clear timers and listeners in cleanup

## Example: Complete Test File Template

```javascript
const request = require('supertest');
const faker = require('faker');
const httpStatus = require('../../src/utils/httpStatus');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { YourModel } = require('../../src/models');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { yourFixture, insertYourFixtures } = require('../fixtures/your.fixture');

setupTestDB();

describe('YourFeature routes', () => {
  describe('POST /v1/your-endpoint', () => {
    let newItem;

    beforeEach(() => {
      newItem = {
        field: faker.lorem.word(),
        // other fields
      };
    });

    test('should return 201 and successfully create item if data is ok', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/v1/your-endpoint')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newItem)
        .expect(httpStatus.CREATED);

      expect(res.body).toMatchObject({
        id: expect.anything(),
        field: newItem.field,
      });

      const dbItem = await YourModel.findByPk(res.body.id);
      expect(dbItem).toBeDefined();
      expect(dbItem).toMatchObject(newItem);
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .post('/v1/your-endpoint')
        .send(newItem)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 error if field is invalid', async () => {
      await insertUsers([userOne]);
      newItem.field = 'invalid value';

      await request(app)
        .post('/v1/your-endpoint')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newItem)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/your-endpoint', () => {
    test('should return 200 and apply default query options', async () => {
      await insertUsers([userOne]);
      await insertYourFixtures([yourFixture]);

      const res = await request(app)
        .get('/v1/your-endpoint')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      });
      expect(res.body.results).toHaveLength(1);
    });
  });

  // Add more route tests...
});
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Sequelize Testing Guide](https://sequelize.org/docs/v6/other-topics/testing/)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#4-testing-and-overall-quality-practices)
