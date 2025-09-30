# Database Guide

This project uses **PostgreSQL** with **Sequelize ORM** for database management.

## Table of Contents

- [Setup](#setup)
- [Connection](#connection)
- [Models](#models)
- [Migrations](#migrations)
- [Seeders](#seeders)
- [Queries](#queries)
- [Backup and Restore](#backup-and-restore)

## Setup

### Local Development

1. **Install PostgreSQL**

   **macOS:**
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

   **Ubuntu/Debian:**
   ```bash
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

   **Windows:**
   Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **Create Database**

   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create database
   CREATE DATABASE node_boilerplate;

   # Create user (optional)
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE node_boilerplate TO your_user;
   ```

3. **Configure Environment**

   Update `.env` file:
   ```bash
   # PostgreSQL Connection String
   DATABASE_URL=postgresql://username:password@localhost:5432/node_boilerplate

   # Or separate variables
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=node_boilerplate
   DB_USER=your_user
   DB_PASSWORD=your_password
   ```

### Docker Setup

The project includes Docker configuration with PostgreSQL:

```bash
# Start PostgreSQL and app
yarn docker:dev

# PostgreSQL will be available at localhost:5432
```

## Connection

Database connection is managed in `src/config/config.js` and initialized in `src/index.js`.

```javascript
const { Sequelize } = require('sequelize');
const config = require('./config/config');

const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: config.env === 'development' ? console.log : false,
});

// Test connection
await sequelize.authenticate();
```

## Models

Models are defined in `src/models/` using Sequelize.

### User Model

**File:** `src/models/user.model.js`

**Schema:**
```javascript
{
  id: UUID (Primary Key),
  name: STRING (required),
  email: STRING (unique, lowercase, required),
  password: STRING (hashed, required),
  role: ENUM('user', 'admin'),
  isEmailVerified: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Custom Methods:**
- `user.isPasswordMatch(password)` - Verify password
- `User.isEmailTaken(email, excludeUserId)` - Check if email exists

**Hooks:**
- Pre-save: Hash password with bcrypt if modified

### Token Model

**File:** `src/models/token.model.js`

**Schema:**
```javascript
{
  id: UUID (Primary Key),
  token: STRING (required, indexed),
  userId: UUID (Foreign Key → User),
  type: ENUM('refresh', 'resetPassword', 'verifyEmail'),
  expires: DATE (required),
  blacklisted: BOOLEAN,
  createdAt: DATE,
  updatedAt: DATE
}
```

**Associations:**
- `Token belongsTo User`
- `User hasMany Tokens`

## Migrations

Migrations provide version control for database schema.

### Running Migrations

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Rollback all migrations
npx sequelize-cli db:migrate:undo:all
```

### Creating Migrations

```bash
# Generate new migration
npx sequelize-cli migration:generate --name migration-name

# Edit the generated file in src/database/migrations/
```

**Migration Example:**
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // ... other fields
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
  },
};
```

## Seeders

Seeders populate the database with initial data for development/testing.

### Running Seeders

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Run specific seeder
npx sequelize-cli db:seed --seed seeder-filename.js

# Undo all seeders
npx sequelize-cli db:seed:undo:all
```

### Creating Seeders

```bash
# Generate new seeder
npx sequelize-cli seed:generate --name demo-users
```

## Queries

### Basic CRUD Operations

**Create:**
```javascript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
});
```

**Read:**
```javascript
// Find by primary key
const user = await User.findByPk(userId);

// Find one with conditions
const user = await User.findOne({ where: { email: 'john@example.com' } });

// Find all
const users = await User.findAll({ where: { role: 'admin' } });
```

**Update:**
```javascript
await user.update({ name: 'Jane Doe' });
// or
await User.update({ name: 'Jane Doe' }, { where: { id: userId } });
```

**Delete:**
```javascript
await user.destroy();
// or
await User.destroy({ where: { id: userId } });
```

### Pagination

The project includes a custom pagination helper:

```javascript
const { paginate } = require('./utils/pagination');

const result = await paginate(User, {
  where: { role: 'user' },
  order: [['createdAt', 'DESC']],
  limit: 10,
  page: 1,
});

// Returns:
// {
//   results: [...],
//   page: 1,
//   limit: 10,
//   totalPages: 5,
//   totalResults: 48
// }
```

### Associations

```javascript
// Fetch user with tokens
const user = await User.findByPk(userId, {
  include: [{ model: Token }],
});

// Fetch token with user
const token = await Token.findOne({
  where: { token: refreshToken },
  include: [{ model: User }],
});
```

## Backup and Restore

### Backup Database

```bash
# Backup to SQL file
pg_dump -U your_user -h localhost node_boilerplate > backup.sql

# Backup with custom format (recommended)
pg_dump -U your_user -h localhost -Fc node_boilerplate > backup.dump
```

### Restore Database

```bash
# Restore from SQL file
psql -U your_user -h localhost node_boilerplate < backup.sql

# Restore from custom format
pg_restore -U your_user -h localhost -d node_boilerplate backup.dump
```

### Automated Backups

**Using cron (Linux/macOS):**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump -U your_user node_boilerplate > /backups/db_$(date +\%Y\%m\%d).sql
```

## Best Practices

1. **Always use migrations** for schema changes
2. **Never commit** `.env` file with real credentials
3. **Use transactions** for multi-step operations
4. **Index frequently queried fields**
5. **Use prepared statements** (Sequelize does this automatically)
6. **Regular backups** in production
7. **Monitor slow queries** and optimize

## Troubleshooting

### Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U your_user -h localhost -d node_boilerplate

# View logs
tail -f /var/log/postgresql/postgresql-*.log  # Linux
tail -f ~/Library/Application\ Support/Postgres/var-*/postgresql.log  # macOS
```

### Reset Database

```bash
# Drop all tables and re-run migrations
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Sequelize CLI](https://github.com/sequelize/cli)