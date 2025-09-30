# System Architecture

Overview of the application architecture, design patterns, and technical decisions.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Design Patterns](#design-patterns)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Request Flow](#request-flow)
- [Security](#security)

## Technology Stack

### Core

- **Runtime:** Node.js (v12+)
- **Framework:** Express.js 5.x
- **Database:** PostgreSQL 12+
- **ORM:** Sequelize 6.x
- **Authentication:** JWT with Passport.js

### Key Libraries

| Library | Purpose |
|---------|---------|
| express-rate-limit | Rate limiting for brute force protection |
| helmet | Security HTTP headers |
| cors | Cross-Origin Resource Sharing |
| joi | Request validation |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT token generation/verification |
| winston | Logging |
| nodemailer | Email sending |
| swagger-jsdoc | API documentation |

### Development

| Tool | Purpose |
|------|---------|
| Jest | Testing framework |
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| lint-staged | Run linters on git staged files |
| nodemon | Development auto-reload |

## Architecture Overview

The application follows a **layered architecture** pattern:

```
┌─────────────────────────────────────────┐
│           Client (Browser/App)          │
└───────────────┬─────────────────────────┘
                │ HTTP/HTTPS
┌───────────────▼─────────────────────────┐
│         Routes Layer (API Endpoints)     │
│  - Request routing                       │
│  - Input validation (Joi)                │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│       Middleware Layer                   │
│  - Authentication                        │
│  - Authorization                         │
│  - Error handling                        │
│  - Rate limiting                         │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│       Controller Layer                   │
│  - Request handling                      │
│  - Response formatting                   │
│  - Error delegation                      │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│       Service Layer (Business Logic)     │
│  - Core business logic                   │
│  - Data processing                       │
│  - External service calls                │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│       Model Layer (Data Access)          │
│  - Database models (Sequelize)           │
│  - Data validation                       │
│  - Relationships                         │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│          PostgreSQL Database             │
└─────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Routes:** Define API endpoints, apply validation
2. **Middleware:** Cross-cutting concerns (auth, logging, errors)
3. **Controllers:** Handle HTTP requests/responses
4. **Services:** Business logic and data operations
5. **Models:** Database schema and data validation

## Directory Structure

```
src/
├── config/                 # Configuration files
│   ├── config.js          # Environment configuration
│   ├── logger.js          # Winston logger setup
│   ├── morgan.js          # HTTP request logger
│   ├── passport.js        # Passport JWT strategy
│   ├── roles.js           # Role definitions
│   └── tokens.js          # Token types
│
├── controllers/           # Request handlers
│   ├── auth.controller.js # Authentication endpoints
│   ├── user.controller.js # User CRUD operations
│   └── index.js           # Export all controllers
│
├── database/              # Database-related files
│   ├── migrations/        # Sequelize migrations
│   ├── seeders/           # Database seeders
│   └── config.js          # Sequelize configuration
│
├── docs/                  # Swagger documentation
│   └── swaggerDef.js      # Swagger definition
│
├── middlewares/           # Custom middleware
│   ├── auth.js            # JWT authentication
│   ├── error.js           # Error handling
│   ├── rateLimiter.js     # Rate limiting
│   └── validate.js        # Request validation
│
├── models/                # Sequelize models
│   ├── user.model.js      # User model
│   ├── token.model.js     # Token model
│   ├── plugins/           # Model helpers
│   │   ├── paginate.js    # Pagination helper
│   │   └── toJSON.js      # JSON transformation
│   └── index.js           # Model exports
│
├── routes/                # API routes
│   └── v1/                # API version 1
│       ├── auth.route.js  # Auth endpoints
│       ├── user.route.js  # User endpoints
│       ├── docs.route.js  # Swagger docs
│       └── index.js       # Route aggregation
│
├── services/              # Business logic
│   ├── auth.service.js    # Auth operations
│   ├── user.service.js    # User operations
│   ├── token.service.js   # Token management
│   ├── email.service.js   # Email sending
│   └── index.js           # Service exports
│
├── utils/                 # Utility functions
│   ├── ApiError.js        # Custom error class
│   ├── catchAsync.js      # Async error wrapper
│   └── pick.js            # Object property picker
│
├── validations/           # Joi validation schemas
│   ├── auth.validation.js # Auth validation
│   ├── user.validation.js # User validation
│   ├── custom.validation.js # Custom validators
│   └── index.js           # Validation exports
│
├── app.js                 # Express app setup
└── index.js               # Application entry point
```

## Design Patterns

### 1. Layered Architecture

Separates concerns into distinct layers, making the codebase maintainable and testable.

### 2. Dependency Injection

Services are injected into controllers, allowing for easy testing and flexibility.

```javascript
// Controller depends on service
const userService = require('../services/user.service');

const createUser = async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).send(user);
};
```

### 3. Repository Pattern (via Sequelize)

Models act as repositories, abstracting database operations.

```javascript
// Service uses model (repository)
const { User } = require('../models');

const getUserById = async (id) => {
  return User.findByPk(id);
};
```

### 4. Middleware Chain

Express middleware pattern for cross-cutting concerns.

```javascript
router.post(
  '/users',
  validate(userValidation.createUser),  // Validation
  auth('manageUsers'),                   // Authentication & Authorization
  userController.createUser              // Handler
);
```

### 5. Factory Pattern

Used for creating tokens and errors.

```javascript
// Token factory
const generateToken = (userId, expires, type) => {
  return jwt.sign({ sub: userId, iat, exp, type }, secret);
};

// Error factory
throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
```

### 6. Strategy Pattern

Passport.js uses strategy pattern for authentication.

```javascript
// JWT Strategy
passport.use(
  'jwt',
  new JwtStrategy(jwtOptions, async (payload, done) => {
    // Strategy implementation
  })
);
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────┐
│            Users                 │
├─────────────────────────────────┤
│ id (PK, UUID)                    │
│ name (VARCHAR)                   │
│ email (VARCHAR, UNIQUE)          │
│ password (VARCHAR, HASHED)       │
│ role (ENUM: user, admin)         │
│ isEmailVerified (BOOLEAN)        │
│ createdAt (TIMESTAMP)            │
│ updatedAt (TIMESTAMP)            │
└───────────┬─────────────────────┘
            │
            │ 1:N
            │
┌───────────▼─────────────────────┐
│           Tokens                 │
├─────────────────────────────────┤
│ id (PK, UUID)                    │
│ token (VARCHAR, INDEXED)         │
│ userId (FK → Users)              │
│ type (ENUM: refresh, reset...)   │
│ expires (TIMESTAMP)              │
│ blacklisted (BOOLEAN)            │
│ createdAt (TIMESTAMP)            │
│ updatedAt (TIMESTAMP)            │
└─────────────────────────────────┘
```

### Indexes

- **Users:**
  - PRIMARY KEY on `id`
  - UNIQUE INDEX on `email`

- **Tokens:**
  - PRIMARY KEY on `id`
  - INDEX on `token` (for fast lookups)
  - FOREIGN KEY on `userId` (references Users.id)
  - INDEX on `expires` (for cleanup queries)

## Authentication & Authorization

### Authentication Flow

```
1. User registers/logs in
   ↓
2. Server generates access + refresh tokens
   ↓
3. Client stores tokens
   ↓
4. Client sends access token with each request
   ↓
5. Server validates token via Passport JWT strategy
   ↓
6. Request proceeds if valid, 401 if invalid
   ↓
7. When access token expires, use refresh token
```

### Token Types

| Type | Purpose | Lifetime | Stored |
|------|---------|----------|--------|
| Access | API authentication | 30 min | Client |
| Refresh | Renew access token | 30 days | Client + DB |
| Reset Password | Password reset link | 10 min | DB |
| Verify Email | Email verification link | 10 min | DB |

### Authorization (RBAC)

**Roles:**
- `user` - Regular user with limited permissions
- `admin` - Administrator with full access

**Permissions:**
```javascript
const roles = ['user', 'admin'];

const roleRights = new Map();
roleRights.set('user', ['getUsers', 'manageUsers']);  // Own profile only
roleRights.set('admin', ['getUsers', 'manageUsers']); // All users
```

## Request Flow

### Typical Request Flow

```
1. HTTP Request
   ↓
2. Express receives request
   ↓
3. Morgan logs HTTP request
   ↓
4. Helmet adds security headers
   ↓
5. CORS validation
   ↓
6. Body parser (JSON)
   ↓
7. XSS & sanitization
   ↓
8. Rate limiter (for /auth routes)
   ↓
9. Route matching
   ↓
10. Validation middleware (Joi)
    ↓
11. Auth middleware (Passport)
    ↓
12. Authorization check (role-based)
    ↓
13. Controller (catchAsync wrapper)
    ↓
14. Service (business logic)
    ↓
15. Model/Database (Sequelize)
    ↓
16. Response formatting
    ↓
17. Winston logs response
    ↓
18. HTTP Response
```

### Error Handling Flow

```
Error thrown anywhere
   ↓
catchAsync wrapper catches
   ↓
Passes to error middleware
   ↓
errorConverter (converts to ApiError)
   ↓
errorHandler (formats and sends response)
   ↓
Winston logs error
   ↓
HTTP Error Response
```

## Security

### Security Measures

1. **Authentication**
   - JWT tokens with expiration
   - Refresh token rotation
   - Bcrypt password hashing (10 rounds)

2. **Authorization**
   - Role-based access control (RBAC)
   - Permission checks at route level

3. **Input Validation**
   - Joi schemas for all inputs
   - SQL injection prevention (Sequelize parameterized queries)
   - XSS protection (xss-clean middleware)
   - Request sanitization

4. **Rate Limiting**
   - 20 requests per 15 minutes for auth endpoints
   - Prevents brute force attacks

5. **HTTP Security Headers** (Helmet.js)
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Strict-Transport-Security

6. **CORS**
   - Configurable allowed origins
   - Credentials support

7. **Secrets Management**
   - Environment variables for sensitive data
   - JWT secret key
   - Database credentials

### Security Checklist

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with short expiration
- ✅ Refresh tokens stored in database (can be revoked)
- ✅ HTTPS enforced in production
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection (via SameSite cookies if used)
- ✅ Rate limiting on sensitive endpoints
- ✅ Security headers via Helmet
- ✅ Error messages don't leak sensitive info
- ✅ Logging for audit trail

## Performance Considerations

1. **Database**
   - Indexes on frequently queried fields
   - Connection pooling (Sequelize default)
   - Pagination for large datasets

2. **Caching** (Future enhancement)
   - Redis for session storage
   - Cache frequently accessed data

3. **Compression**
   - Gzip compression enabled

4. **Clustering**
   - PM2 cluster mode for multi-core utilization

## Testing Strategy

```
Unit Tests
├── Models (validation, methods)
├── Middlewares (auth, error handling)
└── Utils (helper functions)

Integration Tests
├── Authentication flow
├── User CRUD operations
└── API endpoints

Test Database
└── Separate PostgreSQL database for testing
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer / CDN            │
│            (Nginx / Cloudflare)          │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
┌───────▼────────┐ ┌────▼──────────┐
│  App Instance  │ │ App Instance   │
│   (PM2 Cluster)│ │  (PM2 Cluster) │
└───────┬────────┘ └────┬──────────┘
        │                │
        └───────┬────────┘
                │
┌───────────────▼─────────────────────────┐
│      PostgreSQL Database (RDS/Cloud)     │
└─────────────────────────────────────────┘
```

## Monitoring & Logging

**Application Logs** (Winston)
- HTTP requests (Morgan)
- Application errors
- Business logic events

**Log Levels:**
- error → Critical errors
- warn → Warnings
- info → General information
- http → HTTP requests
- debug → Debug information

**Monitoring:**
- PM2 monitoring dashboard
- Database query performance
- API response times
- Error rates

## Future Enhancements

- [ ] Redis for caching and session management
- [ ] WebSocket support for real-time features
- [ ] GraphQL API alongside REST
- [ ] Microservices architecture for scaling
- [ ] Event-driven architecture with message queues
- [ ] Advanced monitoring (New Relic, Datadog)
- [ ] API versioning strategy
- [ ] Background job processing (Bull queue)

## Additional Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [REST API Design Guide](https://restfulapi.net/)