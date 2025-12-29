# API Contracts

This directory contains API specifications and contracts for the Phase II Full-Stack Web Application.

## Files

- **`openapi.yaml`**: OpenAPI 3.1 specification for REST API endpoints
- **`sequence-diagrams.md`**: Sequence diagrams for key user flows

## OpenAPI Specification

The `openapi.yaml` file defines all HTTP endpoints, request/response schemas, authentication, and error handling for the FastAPI backend.

### Viewing the Specification

**Online Swagger Editor**:
1. Open [https://editor.swagger.io/](https://editor.swagger.io/)
2. Copy contents of `openapi.yaml`
3. Paste into editor to view interactive documentation

**Local Swagger UI** (after backend is running):
```bash
# FastAPI automatically serves docs at:
http://localhost:8000/docs      # Swagger UI
http://localhost:8000/redoc      # ReDoc
```

### Generating Client SDKs

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client for Next.js frontend
openapi-generator-cli generate \
  -i contracts/openapi.yaml \
  -g typescript-fetch \
  -o frontend/src/lib/api-client

# Generate Python client (for testing)
openapi-generator-cli generate \
  -i contracts/openapi.yaml \
  -g python \
  -o tests/api-client
```

## API Endpoint Summary

### Authentication Endpoints (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create new user account |
| POST | `/api/auth/signin` | Sign in with email/password |
| POST | `/api/auth/signout` | Sign out current user |

### Task Endpoints (Auth Required)

| Method | Path | Description | User Isolation |
|--------|------|-------------|----------------|
| GET | `/api/tasks` | List all tasks (paginated) | ✅ Scoped to user |
| POST | `/api/tasks` | Create new task | ✅ Auto-assigned to user |
| GET | `/api/tasks/{task_id}` | Get specific task | ✅ Ownership verified |
| PATCH | `/api/tasks/{task_id}` | Update task title/description | ✅ Ownership verified |
| DELETE | `/api/tasks/{task_id}` | Delete task | ✅ Ownership verified |
| POST | `/api/tasks/{task_id}/toggle` | Toggle completion status | ✅ Ownership verified |

## Authentication Flow

```
1. User submits email/password to /api/auth/signup or /api/auth/signin
   ↓
2. Better Auth validates credentials, creates session
   ↓
3. Better Auth issues JWT (signed with Ed25519 private key)
   ↓
4. Response includes JWT in body: {"user": {...}, "token": "eyJ..."}
   ↓
5. Client stores JWT (in-memory or httpOnly cookie)
   ↓
6. Client includes JWT in Authorization header: "Bearer eyJ..."
   ↓
7. FastAPI verifies JWT signature using JWKS public key
   ↓
8. FastAPI extracts user_id from JWT "sub" claim
   ↓
9. All task queries automatically filter by user_id
```

## HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| **200 OK** | Success | GET, PATCH, POST toggle |
| **201 Created** | Resource created | POST signup, POST tasks |
| **204 No Content** | Success with no body | DELETE tasks, POST signout |
| **400 Bad Request** | Validation error | Empty title, title too long |
| **401 Unauthorized** | Authentication failed | Missing/invalid/expired JWT |
| **404 Not Found** | Resource not found | Task doesn't exist OR user doesn't own it |
| **409 Conflict** | Duplicate resource | Email already registered |
| **422 Unprocessable Entity** | Pydantic validation error | Incorrect request format |
| **500 Internal Server Error** | Server error | Unhandled exceptions |

## Error Response Format

**Validation Error (400)**:
```json
{
  "detail": "Title cannot be empty"
}
```

**Authentication Error (401)**:
```json
{
  "detail": "Could not validate credentials"
}
```

**Not Found (404)**:
```json
{
  "detail": "Task not found"
}
```

**Pydantic Validation Error (422)**:
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "title"],
      "msg": "String should have at least 1 character",
      "input": "",
      "ctx": {"min_length": 1}
    }
  ]
}
```

## Request Examples

### Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "SecurePass123!"}'
```

### Signin
```bash
curl -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "SecurePass123!"}'
```

### Create Task (with JWT)
```bash
TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'
```

### List Tasks (with JWT)
```bash
curl -X GET "http://localhost:8000/api/tasks?offset=0&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Task (with JWT)
```bash
curl -X PATCH http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Buy groceries and cook dinner"}'
```

### Toggle Task Status (with JWT)
```bash
curl -X POST http://localhost:8000/api/tasks/1/toggle \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Task (with JWT)
```bash
curl -X DELETE http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Security Considerations

1. **JWT in Authorization Header**: Never send JWT in URL query parameters (logged in server logs)
2. **HTTPS Only**: All requests must use HTTPS in production (JWT in plain HTTP = security risk)
3. **Short Token Expiry**: JWTs expire after 1 hour; client must refresh using session cookie
4. **User Isolation**: API returns 404 (not 403) for unauthorized access to prevent enumeration
5. **CORS Restriction**: FastAPI only accepts requests from frontend domain (no wildcard `*`)

## Validation Rules

### Email
- Format: Valid email address (RFC 5321)
- Max length: 320 characters
- Uniqueness: Must be unique across all users

### Password
- Min length: 8 characters
- Max length: 128 characters
- Complexity: Must include uppercase, lowercase, and number (enforced by Better Auth)

### Task Title
- Min length: 1 character (after trimming whitespace)
- Max length: 200 characters
- Required: Cannot be null or empty

### Task Description
- Min length: 0 characters (optional)
- Max length: 2000 characters
- Default: Empty string if not provided

## Pagination

All list endpoints support pagination with `offset` and `limit` query parameters:

```
GET /api/tasks?offset=0&limit=20   # First 20 tasks
GET /api/tasks?offset=20&limit=20  # Next 20 tasks
GET /api/tasks?offset=40&limit=20  # Next 20 tasks
```

**Default values**:
- `offset`: 0 (start from beginning)
- `limit`: 100 (max 100 tasks per request)

## Next Steps

1. Implement FastAPI endpoints following OpenAPI spec
2. Generate TypeScript client for Next.js frontend
3. Add integration tests validating API contracts
4. Set up contract testing (Pact, Dredd, or Schemathesis)

---

**Document created**: 2025-12-28
**Related artifacts**: `data-model.md`, `research.md`
