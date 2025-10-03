# Authentication, Roles & Permissions

Complete guide to the role-based access control (RBAC) system including how roles and permissions work, and how to manage them.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Default Roles & Permissions](#default-roles--permissions)
- [How It Works](#how-it-works)
- [Managing Roles](#managing-roles)
- [Managing Permissions](#managing-permissions)
- [Protecting Routes](#protecting-routes)
- [User Role Assignment](#user-role-assignment)
- [Examples](#examples)

## Overview

This application uses a **role-based access control (RBAC)** system where:

- Each **user** has a single **role** (e.g., `user`, `admin`)
- Each **role** has a set of **permissions** (e.g., `getUsers`, `manageUsers`)
- Routes can require specific **permissions** to access
- Authentication is handled via **JWT (JSON Web Tokens)**

**Key Components:**

- [src/config/roles.js](../src/config/roles.js) - Defines all roles and their permissions
- [src/middlewares/auth.js](../src/middlewares/auth.js) - Authentication & authorization middleware
- [src/models/user.model.js](../src/models/user.model.js) - User model with role field
- [src/services/auth.service.js](../src/services/auth.service.js) - Authentication business logic

## Architecture

### Authentication Flow

```
User Request → JWT Validation → Role Check → Permission Check → Route Handler
                     ↓               ↓              ↓
                  Passport       User Object    roleRights Map
```

1. **JWT Validation**: Passport validates the JWT token
2. **User Extraction**: User object (including role) is extracted from token
3. **Permission Check**: User's role permissions are checked against required permissions
4. **Authorization**: Request proceeds if user has all required permissions

### Components

**1. Roles Configuration** ([src/config/roles.js](../src/config/roles.js))
```javascript
const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers'],
};
```

**2. Auth Middleware** ([src/middlewares/auth.js](../src/middlewares/auth.js))
```javascript
const auth = (...requiredRights) => async (req, res, next) => {
  // Validates JWT and checks permissions
};
```

**3. User Model** ([src/models/user.model.js](../src/models/user.model.js))
```javascript
role: {
  type: DataTypes.ENUM(...roles),
  defaultValue: 'user',
}
```

## Default Roles & Permissions

The system comes with two default roles:

### User Role
```javascript
user: []
```
- **Permissions**: None explicitly defined
- **Access**: Can access their own data (via `req.params.userId === user.id` check)
- **Use Case**: Regular authenticated users

### Admin Role
```javascript
admin: ['getUsers', 'manageUsers']
```
- **Permissions**:
  - `getUsers` - Can retrieve all users and user details
  - `manageUsers` - Can create, update, and delete users
- **Access**: Full user management capabilities
- **Use Case**: System administrators

## How It Works

### 1. User Login

When a user logs in:
```javascript
// POST /v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

The system:
1. Validates credentials via [authService.loginUserWithEmailAndPassword()](../src/services/auth.service.js:14)
2. Generates JWT tokens containing user ID and role
3. Returns access token and refresh token

### 2. Making Authenticated Requests

Client includes JWT in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Permission Verification

The `auth()` middleware ([src/middlewares/auth.js](../src/middlewares/auth.js)) performs verification:

```javascript
const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  // 1. Verify JWT token is valid
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }

  req.user = user; // Attach user to request

  // 2. Check if user has required permissions
  if (requiredRights.length) {
    const userRights = roleRights.get(user.role); // Get user's permissions
    const hasRequiredRights = requiredRights.every((requiredRight) =>
      userRights.includes(requiredRight)
    );

    // 3. Allow if user has all permissions OR accessing own data
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  resolve();
};
```

**Special Rule**: Users can always access their own data, even without explicit permissions, if `req.params.userId` matches their user ID.

## Managing Roles

### Creating a New Role

**1. Edit** [src/config/roles.js](../src/config/roles.js)

```javascript
const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers'],
  moderator: ['getUsers'],  // Add new role
};
```

**2. Update User Model** ([src/models/user.model.js](../src/models/user.model.js:45))

The role enum is automatically generated from the `roles` array:
```javascript
role: {
  type: DataTypes.ENUM(...roles), // Automatically includes new roles
  defaultValue: 'user',
}
```

**3. Restart the application** for changes to take effect.

**4. Run migrations** if needed to update the database enum type:
```bash
npm run db:migrate
```

### Modifying an Existing Role

Simply edit the permissions array in [src/config/roles.js](../src/config/roles.js):

```javascript
const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers', 'deleteUsers'], // Add permission
  moderator: ['getUsers'], // Modified from above
};
```

### Deleting a Role

**1. Remove from** [src/config/roles.js](../src/config/roles.js)

```javascript
const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers'],
  // moderator removed
};
```

**2. Update existing users** with the deleted role:
```sql
-- Update users with deleted role to 'user'
UPDATE users SET role = 'user' WHERE role = 'moderator';
```

**3. Run migrations** to update database schema.

**⚠️ Important**: Ensure no users have the role before deleting, or reassign them first.

## Managing Permissions

### Creating a New Permission

**1. Add to roles** in [src/config/roles.js](../src/config/roles.js):

```javascript
const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers', 'viewReports'], // New permission
};
```

**2. Protect routes** with the new permission:

```javascript
router.get('/reports', auth('viewReports'), reportController.getReports);
```

### Permission Naming Conventions

Follow these conventions for consistency:

- **get{Resource}** - Read access (e.g., `getUsers`, `getPosts`)
- **manage{Resource}** - Full CRUD access (e.g., `manageUsers`, `managePosts`)
- **create{Resource}** - Create only (e.g., `createPost`)
- **update{Resource}** - Update only (e.g., `updatePost`)
- **delete{Resource}** - Delete only (e.g., `deletePost`)

### Adding Permissions to Roles

Edit the role's permissions array in [src/config/roles.js](../src/config/roles.js):

```javascript
const allRoles = {
  user: ['createPost', 'updateOwnPost'],  // Users can create and update their posts
  admin: ['getUsers', 'manageUsers', 'managePosts'], // Admins can manage everything
  moderator: ['getUsers', 'managePosts'], // Moderators can manage posts
};
```

### Removing Permissions from Roles

Simply remove from the permissions array:

```javascript
const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers'], // 'managePosts' removed
};
```

## Protecting Routes

### Using the Auth Middleware

The `auth()` middleware is used in route definitions:

**Syntax:**
```javascript
auth(...requiredPermissions)
```

**Examples:**

**1. Require authentication only (no specific permissions):**
```javascript
router.post('/send-verification-email', auth(), authController.sendVerificationEmail);
```

**2. Require specific permission:**
```javascript
router.get('/users', auth('getUsers'), userController.getUsers);
```

**3. Require multiple permissions:**
```javascript
router.post('/admin/reports',
  auth('getUsers', 'viewReports'),
  reportController.createReport
);
```

### Route Examples from Codebase

**User Routes** ([src/routes/v1/user.route.js](../src/routes/v1/user.route.js)):

```javascript
router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageUsers'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);
```

**Auth Routes** ([src/routes/v1/auth.route.js](../src/routes/v1/auth.route.js)):

```javascript
router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/send-verification-email', auth(), authController.sendVerificationEmail);
```

### Access Control Logic

The middleware allows access if **any** of these conditions are met:

1. ✅ **No permissions required** - Route uses `auth()` with no arguments
2. ✅ **User has all required permissions** - User's role includes all required permissions
3. ✅ **Accessing own data** - `req.params.userId === req.user.id`

**Example**: A regular `user` can access `GET /users/:userId` for their own ID, but only `admin` (with `getUsers` permission) can access other users' data.

## User Role Assignment

### During Registration

By default, new users are assigned the `user` role:

```javascript
// src/models/user.model.js
role: {
  type: DataTypes.ENUM(...roles),
  defaultValue: 'user', // Default role for new users
}
```

### Creating Users with Specific Roles

**Only admins** can create users with specific roles:

```bash
# Admin creates a new moderator
curl -X POST http://localhost:3000/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Moderator",
    "email": "jane@example.com",
    "password": "password123",
    "role": "moderator"
  }'
```

### Changing User Roles

**Admin updates a user's role:**

```bash
curl -X PATCH http://localhost:3000/v1/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

**Validation**: The role must exist in the `roles` enum defined in [src/config/roles.js](../src/config/roles.js).

### Checking Current User's Role

The authenticated user's role is available in route handlers:

```javascript
const someController = async (req, res) => {
  const userRole = req.user.role; // 'user', 'admin', etc.
  const userId = req.user.id;

  // Custom logic based on role
  if (userRole === 'admin') {
    // Admin-specific logic
  }
};
```

## Examples

### Example 1: Adding a Blog Post System

**Scenario**: Add blog posts where users can create posts, but only admins can delete any post.

**1. Define permissions** in [src/config/roles.js](../src/config/roles.js):
```javascript
const allRoles = {
  user: ['createPost', 'updateOwnPost', 'deleteOwnPost'],
  admin: ['getUsers', 'manageUsers', 'managePosts'],
};
```

**2. Create routes** in `src/routes/v1/post.route.js`:
```javascript
const express = require('express');
const auth = require('../../middlewares/auth');
const postController = require('../../controllers/post.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('createPost'), postController.createPost)
  .get(postController.getPosts); // Public route

router
  .route('/:postId')
  .get(postController.getPost)
  .patch(auth('updateOwnPost'), postController.updatePost)
  .delete(auth('managePosts'), postController.deletePost); // Only admin

module.exports = router;
```

**3. Add authorization logic** in `src/controllers/post.controller.js`:
```javascript
const updatePost = async (req, res) => {
  const post = await Post.findByPk(req.params.postId);

  // Users can only update their own posts
  if (post.userId !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  // Update logic...
};
```

### Example 2: Creating a Moderator Role

**1. Add moderator role** in [src/config/roles.js](../src/config/roles.js):
```javascript
const allRoles = {
  user: [],
  moderator: ['getUsers', 'managePosts', 'manageComments'],
  admin: ['getUsers', 'manageUsers', 'managePosts', 'manageComments'],
};
```

**2. Create a moderator user:**
```bash
curl -X POST http://localhost:3000/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Moderator",
    "email": "john.mod@example.com",
    "password": "password123",
    "role": "moderator"
  }'
```

**3. Moderators can now:**
- View all users (via `getUsers` permission)
- Manage posts (via `managePosts` permission)
- Manage comments (via `manageComments` permission)

### Example 3: Custom Permission Logic

**Scenario**: Allow users to update their own profile, but require `manageUsers` permission to update others.

This is already handled by the middleware! The logic in [src/middlewares/auth.js:15](../src/middlewares/auth.js:15) automatically allows users to access routes when `req.params.userId === req.user.id`:

```javascript
// User route with 'manageUsers' permission
router.patch('/users/:userId', auth('manageUsers'), userController.updateUser);

// What happens:
// - Admin with 'manageUsers': ✅ Can update any user
// - Regular user updating themselves: ✅ Allowed (userId matches)
// - Regular user updating others: ❌ Forbidden
```

### Example 4: Multiple Permissions Required

**Scenario**: Generate reports requires both user access and report permissions.

```javascript
// src/config/roles.js
const allRoles = {
  user: [],
  analyst: ['getUsers', 'viewReports'],
  admin: ['getUsers', 'manageUsers', 'viewReports', 'manageReports'],
};

// src/routes/v1/report.route.js
router.get('/user-reports',
  auth('getUsers', 'viewReports'),  // Requires BOTH permissions
  reportController.getUserReports
);
```

Only `analyst` and `admin` roles can access this route since both have both required permissions.

### Example 5: Public Routes

Routes without `auth()` middleware are public:

```javascript
// Anyone can access (no authentication required)
router.get('/public/posts', postController.getPublicPosts);

// Must be authenticated (but no specific permissions needed)
router.get('/profile', auth(), userController.getProfile);

// Must be authenticated AND have 'getUsers' permission
router.get('/users', auth('getUsers'), userController.getUsers);
```

## Security Best Practices

### 1. Principle of Least Privilege
- Give users only the permissions they need
- Start with minimal permissions and add as needed
- Regularly audit role permissions

### 2. Validate in Controllers
Even with middleware protection, always validate permissions in controllers:

```javascript
const deleteUser = async (req, res) => {
  // Double-check: Don't allow users to delete themselves
  if (req.params.userId === req.user.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete yourself');
  }

  // Delete logic...
};
```

### 3. Audit Role Changes
Log when user roles are modified:

```javascript
// In user update controller
if (updateBody.role && updateBody.role !== user.role) {
  logger.info(`Role changed for user ${user.id} from ${user.role} to ${updateBody.role}`);
}
```

### 4. Token Security
- Access tokens expire after 30 minutes
- Refresh tokens expire after 30 days
- Tokens are invalidated on logout
- Store tokens securely on the client

### 5. Role Consistency
- Keep role names consistent and descriptive
- Document all roles and their intended use
- Don't create too many granular roles (use permissions instead)

## Troubleshooting

### 401 Unauthorized

**Cause**: JWT token is invalid or expired

**Solutions:**
- Use refresh token to get new access token
- Re-login if refresh token is also expired
- Check `Authorization: Bearer TOKEN` header format

### 403 Forbidden

**Cause**: User lacks required permissions

**Solutions:**
- Check user's role: `GET /v1/users/:userId`
- Verify role has required permissions in [src/config/roles.js](../src/config/roles.js)
- Check if route requires specific permissions
- For own data access, ensure `userId` param matches authenticated user

### User Can't Access Own Data

**Cause**: Route might not have the `userId` param check

**Solution**: Ensure route param is named `userId`:
```javascript
// ✅ Correct - allows own data access
router.get('/users/:userId', auth('getUsers'), userController.getUser);

// ❌ Wrong - won't match for own data
router.get('/users/:id', auth('getUsers'), userController.getUser);
```

### New Role Not Working

**Causes:**
1. Database enum not updated
2. Application not restarted
3. Role not added to `allRoles` in [src/config/roles.js](../src/config/roles.js)

**Solutions:**
1. Run migrations: `npm run db:migrate`
2. Restart the application
3. Verify role exists in [src/config/roles.js](../src/config/roles.js)

## Related Documentation

- [API Usage Guide](./API_GUIDE.md) - How to use the API with authentication
- [Architecture Guide](./ARCHITECTURE.md) - Overall application architecture
- [Database Guide](./DATABASE.md) - Database schema and models
