# API Usage Guide

Complete guide for using the RESTful API with authentication, examples, and best practices.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication Flow](#authentication-flow)
- [Making Requests](#making-requests)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Rate Limiting](#rate-limiting)
- [API Examples](#api-examples)

## Quick Start

### Base URL

```
Development: http://localhost:3000/v1
Production: https://your-domain.com/v1
```

### API Documentation

Interactive API documentation is available at:
```
http://localhost:3000/v1/docs
```

## Authentication Flow

The API uses JWT (JSON Web Tokens) for authentication.

### 1. Register a New User

**Request:**
```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "5f9b3b3b-7b1a-4b3b-8b3b-3b3b3b3b3b3b",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": false
  },
  "tokens": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2024-01-01T12:00:00.000Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2024-01-30T12:00:00.000Z"
    }
  }
}
```

### 2. Login

**Request:**
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:** Same as registration response

### 3. Use Access Token

Include the access token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Tokens

Access tokens expire after 30 minutes. Use the refresh token to get new tokens:

**Request:**
```bash
curl -X POST http://localhost:3000/v1/auth/refresh-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Response:**
```json
{
  "access": {
    "token": "new_access_token...",
    "expires": "2024-01-01T12:30:00.000Z"
  },
  "refresh": {
    "token": "new_refresh_token...",
    "expires": "2024-01-30T12:30:00.000Z"
  }
}
```

### 5. Logout

**Request:**
```bash
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Making Requests

### JavaScript (Fetch API)

```javascript
// Helper function for authenticated requests
async function apiRequest(endpoint, options = {}) {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(`http://localhost:3000/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired, refresh it
    await refreshTokens();
    return apiRequest(endpoint, options);
  }

  return response.json();
}

// Refresh tokens
async function refreshTokens() {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('http://localhost:3000/v1/auth/refresh-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const { access, refresh } = await response.json();
  localStorage.setItem('accessToken', access.token);
  localStorage.setItem('refreshToken', refresh.token);
}

// Example usage
const users = await apiRequest('/users?page=1&limit=10');
```

### Python (Requests)

```python
import requests

BASE_URL = 'http://localhost:3000/v1'

class APIClient:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None

    def login(self, email, password):
        response = requests.post(f'{BASE_URL}/auth/login', json={
            'email': email,
            'password': password
        })
        data = response.json()
        self.access_token = data['tokens']['access']['token']
        self.refresh_token = data['tokens']['refresh']['token']
        return data

    def request(self, method, endpoint, **kwargs):
        headers = kwargs.get('headers', {})
        headers['Authorization'] = f'Bearer {self.access_token}'
        kwargs['headers'] = headers

        response = requests.request(method, f'{BASE_URL}{endpoint}', **kwargs)

        if response.status_code == 401:
            self.refresh_tokens()
            return self.request(method, endpoint, **kwargs)

        return response.json()

    def refresh_tokens(self):
        response = requests.post(f'{BASE_URL}/auth/refresh-tokens', json={
            'refreshToken': self.refresh_token
        })
        data = response.json()
        self.access_token = data['access']['token']
        self.refresh_token = data['refresh']['token']

# Usage
client = APIClient()
client.login('john@example.com', 'password123')
users = client.request('GET', '/users?page=1&limit=10')
```

## Error Handling

### Error Response Format

```json
{
  "code": 400,
  "message": "Email already taken"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (success with no response body) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication required/failed) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Common Errors

**Validation Error:**
```json
{
  "code": 400,
  "message": "\"password\" length must be at least 8 characters long"
}
```

**Authentication Error:**
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

**Permission Error:**
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

### Handling Errors in JavaScript

```javascript
try {
  const response = await fetch('http://localhost:3000/v1/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error('API Error:', error.message);
}
```

## Pagination

List endpoints support pagination with the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `sortBy` | string | createdAt:desc | Sort field and order |

### Example Request

```bash
curl "http://localhost:3000/v1/users?page=2&limit=20&sortBy=name:asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response Format

```json
{
  "results": [
    { "id": "...", "name": "Alice", "email": "alice@example.com" },
    { "id": "...", "name": "Bob", "email": "bob@example.com" }
  ],
  "page": 2,
  "limit": 20,
  "totalPages": 5,
  "totalResults": 98
}
```

### Sorting

**Single field:**
```
?sortBy=name:asc
?sortBy=createdAt:desc
```

**Multiple fields:**
```
?sortBy=name:asc,createdAt:desc
```

## Rate Limiting

Authentication endpoints are rate-limited to prevent brute force attacks:

- **Limit:** 20 requests per 15 minutes per IP
- **Endpoints:** `/v1/auth/*`

**Rate limit headers:**
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1640995200
```

**Rate limit exceeded response:**
```json
{
  "code": 429,
  "message": "Too many requests, please try again later."
}
```

## API Examples

### User Management

#### Create User (Admin only)

```bash
curl -X POST http://localhost:3000/v1/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "role": "user"
  }'
```

#### Get All Users

```bash
curl -X GET "http://localhost:3000/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get User by ID

```bash
curl -X GET http://localhost:3000/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update User

```bash
curl -X PATCH http://localhost:3000/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated"
  }'
```

#### Delete User

```bash
curl -X DELETE http://localhost:3000/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Password Management

#### Forgot Password

```bash
curl -X POST http://localhost:3000/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

An email with a reset token will be sent.

#### Reset Password

```bash
curl -X POST "http://localhost:3000/v1/auth/reset-password?token=RESET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newPassword123"
  }'
```

### Email Verification

#### Send Verification Email

```bash
curl -X POST http://localhost:3000/v1/auth/send-verification-email \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Verify Email

```bash
curl -X POST "http://localhost:3000/v1/auth/verify-email?token=VERIFY_TOKEN"
```

## Postman Collection

Import the API into Postman:

1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:3000/v1/docs`
4. Select "OpenAPI" format

Or create a collection manually:

**Environment Variables:**
```
baseUrl: http://localhost:3000/v1
accessToken: (set after login)
refreshToken: (set after login)
```

**Pre-request Script for Authentication:**
```javascript
// Automatically add access token to requests
const accessToken = pm.environment.get('accessToken');
if (accessToken) {
  pm.request.headers.add({
    key: 'Authorization',
    value: `Bearer ${accessToken}`
  });
}
```

## Best Practices

1. **Store tokens securely**
   - Use httpOnly cookies or secure storage
   - Never store in localStorage for sensitive apps

2. **Handle token expiration**
   - Implement automatic token refresh
   - Show login prompt when refresh fails

3. **Use HTTPS in production**
   - Never send tokens over HTTP

4. **Implement retry logic**
   - Retry failed requests with exponential backoff

5. **Validate input client-side**
   - Reduce unnecessary API calls
   - Provide immediate feedback

6. **Cache responses when appropriate**
   - Use ETags or Cache-Control headers

7. **Handle network errors gracefully**
   - Show user-friendly error messages
   - Provide retry options

## Troubleshooting

### Token Issues

**401 Unauthorized:**
- Token expired → Use refresh token
- Invalid token → Login again
- Missing token → Check Authorization header

**403 Forbidden:**
- Insufficient permissions → Check user role
- Action not allowed → Review API documentation

### Validation Errors

**400 Bad Request:**
- Check request body format
- Verify required fields
- Validate field types and constraints

### Connection Issues

- Check API is running: `curl http://localhost:3000/v1/health`
- Verify network connectivity
- Check firewall settings
- Review CORS configuration

## Additional Resources

- [Swagger Documentation](http://localhost:3000/v1/docs)
- [Postman](https://www.postman.com/)
- [JWT Debugger](https://jwt.io/)
- [REST API Best Practices](https://restfulapi.net/)