# Authentication Architecture Research: Better Auth + JWT for FastAPI + Next.js

**Feature**: `002-fullstack-web-app`
**Created**: 2025-12-28
**Research Focus**: Authentication strategy for multi-user todo application with separate FastAPI backend and Next.js frontend

## Executive Summary

### Decision Recommendation: **Hybrid Approach with Better Auth JWT Plugin**

Use Better Auth in Next.js with its JWT plugin to issue tokens verifiable by FastAPI backend via JWKS endpoint. This provides stateless authentication with strong security, leverages modern tooling, and maintains clear separation between frontend auth UI and backend API protection.

**Key Pattern**: Better Auth (Next.js) → JWT issuance → JWKS verification (FastAPI) → User isolation on API endpoints

---

## Research Questions Answered

### 1. Better Auth JWT Strategy: How does Better Auth issue JWTs verifiable by FastAPI?

**Mechanism**:
- Better Auth provides a dedicated **JWT plugin** that generates signed JWTs using industry-standard algorithms
- Default algorithm: **Ed25519 (EdDSA)** - modern, secure, fast asymmetric signing
- Alternative algorithms supported: ES256, RSA256, PS256, ECDH-ES, ES512, HS256 (symmetric)

**Token Issuance Flow**:
1. User signs up/signs in via Better Auth in Next.js
2. Better Auth creates session (stored in httpOnly cookie)
3. Client requests JWT token via Better Auth JWT plugin:
   - Method 1 (Recommended): `authClient.token()` call
   - Method 2: Direct API call to `/api/auth/token` endpoint
   - Method 3: Extract from `set-auth-jwt` response header on `getSession()`
4. Better Auth generates JWT with:
   - **Header**: `{ "alg": "EdDSA", "kid": "key-id", "typ": "JWT" }`
   - **Payload**: User claims (default: entire user object, customizable)
   - **Signature**: Signed with private key

**Verification on FastAPI**:
- Better Auth exposes **JWKS endpoint** at `/api/auth/jwks` (default) or `/.well-known/jwks.json` (OAuth convention)
- JWKS contains public keys needed to verify JWT signatures
- FastAPI fetches JWKS and verifies tokens using `jose` library (Python equivalent of JavaScript's `jose`)

**Example JWKS Response**:
```json
{
  "keys": [{
    "crv": "Ed25519",
    "x": "bDHiLTt7u-VIU7rfmcltcFhaHKLVvWFy-_csKZARUEU",
    "kty": "OKP",
    "kid": "c5c7995d-0037-4553-8aee-b5b620b89b23"
  }]
}
```

**Default JWT Claims**:
- `sub`: User ID (subject)
- `iss`: Issuer (defaults to `BASE_URL`, e.g., `http://localhost:3000`)
- `aud`: Audience (defaults to `BASE_URL`)
- `exp`: Expiration timestamp (default: 15 minutes from issuance)
- `iat`: Issued at timestamp
- Plus custom payload (user object by default)

**Customization Options**:
```typescript
// Better Auth configuration
jwt({
  jwt: {
    definePayload: ({user}) => ({
      id: user.id,
      email: user.email,
      role: user.role  // Custom claims
    }),
    issuer: "https://todo-app.example.com",
    audience: "https://api.todo-app.example.com",
    expirationTime: "1h",
    getSubject: (session) => session.user.id
  }
})
```

**Why This Works**:
- **Asymmetric signing** (Ed25519): Private key stays in Better Auth (Next.js), public key in JWKS for FastAPI
- **No shared secrets needed** (unlike HS256): FastAPI only needs JWKS endpoint URL
- **Standards-based**: Uses RFC 7517 (JWKS), RFC 7519 (JWT), RFC 8037 (EdDSA)
- **Key rotation support**: Better Auth can rotate keys with `rotationInterval` + `gracePeriod`

**Sources**:
- [Better Auth JWT Plugin Documentation](https://www.better-auth.com/docs/plugins/jwt)
- [JWT Introduction - jwt.io](https://www.jwt.io/introduction)

---

### 2. Tradeoffs: Stateless JWT vs Session-Based Auth

#### Option A: Stateless JWT (Recommended for This Use Case)

**How it works**:
- User authenticates → Receives JWT → JWT sent with each API request
- Backend verifies JWT signature and claims (no database lookup)
- User context extracted from JWT payload

**Advantages**:
- **Horizontal scaling**: No session storage needed; any backend instance can verify tokens
- **Microservices-friendly**: Shared JWKS endpoint enables multiple backend services
- **Performance**: No database query per request for session validation
- **Separation of concerns**: Frontend (Better Auth) handles auth UI; backend just verifies tokens
- **Stateless**: Backend doesn't maintain session state

**Disadvantages**:
- **Cannot revoke immediately**: Once issued, JWT valid until expiration (mitigation: short expiry + refresh tokens)
- **Token size**: JWTs larger than session IDs (typical JWT: 200-500 bytes vs session ID: 32 bytes)
- **Payload exposure**: JWT payload visible to client (don't include sensitive data)
- **Complexity**: Requires proper key management, JWKS setup, rotation strategy

**Best for**:
- Multi-user SaaS applications (like this todo app)
- RESTful APIs with separate frontend/backend
- Applications with strict data isolation per user
- Horizontally scaled backends

#### Option B: Session-Based Auth

**How it works**:
- User authenticates → Session created in database → Session ID in httpOnly cookie
- Each request includes session cookie → Backend queries database for session
- User context retrieved from session data in database

**Advantages**:
- **Immediate revocation**: Logout deletes session from database
- **Smaller cookies**: Only session ID transmitted (32 bytes)
- **Flexibility**: Can change user permissions without reissuing credentials
- **Built-in to Better Auth**: Default session strategy

**Disadvantages**:
- **Database dependency**: Every request requires session lookup (performance impact at scale)
- **Scaling complexity**: Requires sticky sessions or shared session store (Redis)
- **Cross-service challenges**: Each service needs access to session database
- **State management**: Backend must maintain session state

**Best for**:
- Monolithic applications
- Applications with frequent permission changes
- Use cases requiring instant session revocation
- Small-scale applications where database lookups are acceptable

#### Hybrid Approach (Industry Best Practice)

**Pattern**:
- **Short-lived access token** (JWT, 15 minutes): Stored in memory (React state) or localStorage
- **Long-lived refresh token** (7-14 days): Stored in httpOnly cookie, validated against database

**Benefits**:
- Combines JWT performance with revocation capability
- Refresh token can be invalidated in database (logout, security breach)
- Access token theft has limited damage window (15 minutes)
- Better Auth supports both strategies simultaneously

**Implementation**:
1. User signs in → Receives access JWT + refresh token (httpOnly cookie)
2. API requests use access JWT from memory
3. When access JWT expires → Use refresh token to get new access JWT
4. Logout → Delete refresh token from database

**Tradeoff Matrix**:

| Factor | Stateless JWT | Session-Based | Hybrid |
|--------|--------------|---------------|--------|
| **Scalability** | Excellent | Moderate | Excellent |
| **Performance** | Fast | Slower (DB lookup) | Fast |
| **Revocation** | Delayed | Immediate | Immediate (refresh) |
| **Complexity** | Medium | Low | High |
| **Security** | Good (with short expiry) | Good | Best |
| **Use Case Fit** | **Perfect for todo app** | Monolith | High-security apps |

**Recommendation for Todo App**: **Stateless JWT** with 1-hour expiry
- Aligns with separation of Next.js (frontend) and FastAPI (backend)
- No shared session database needed
- Simple implementation for Phase II
- Can upgrade to Hybrid in Phase III if needed

**Sources**:
- [Better Auth vs NextAuth Comparison](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/)
- [LocalStorage vs Cookies Security Guide](https://www.cyberchief.ai/2023/05/secure-jwt-token-storage.html)
- [Auth.js Session Strategies](https://authjs.dev/concepts/session-strategies)

---

### 3. Implementation Pattern: Sharing Authentication Between Next.js and FastAPI

#### Problem Statement
Better Auth runs in Next.js (`/api/auth/*` routes). FastAPI is a separate backend service. How do they securely share authentication?

#### Recommended Solution: JWKS-Based Verification (No Secret Sharing)

**Architecture**:
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js App   │         │  Better Auth     │         │  FastAPI API    │
│   (Frontend)    │         │  (Next.js /api)  │         │   (Backend)     │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                           │                            │
         │ 1. Sign in               │                            │
         │─────────────────────────>│                            │
         │                           │                            │
         │ 2. Session cookie        │                            │
         │<─────────────────────────│                            │
         │                           │                            │
         │ 3. Request JWT token     │                            │
         │─────────────────────────>│                            │
         │                           │                            │
         │ 4. JWT token             │                            │
         │<─────────────────────────│                            │
         │                           │                            │
         │ 5. API request + JWT     │                            │
         │────────────────────────────────────────────────────>│
         │                           │                            │
         │                           │ 6. Fetch JWKS (cached)    │
         │                           │<───────────────────────────│
         │                           │                            │
         │                           │ 7. JWKS public keys        │
         │                           │────────────────────────────>│
         │                           │                            │
         │                           │         8. Verify JWT      │
         │                           │         signature          │
         │                           │                            │
         │ 9. API response          │                            │
         │<────────────────────────────────────────────────────│
```

**Configuration Steps**:

**Step 1: Better Auth Setup (Next.js)**
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: {
    // Database connection for user accounts + sessions
    type: "postgres",
    url: process.env.DATABASE_URL
  },
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.NEXT_PUBLIC_APP_URL,
        audience: process.env.NEXT_PUBLIC_API_URL,  // FastAPI URL
        expirationTime: "1h",
        definePayload: ({user}) => ({
          id: user.id,
          email: user.email
        })
      },
      jwks: {
        keyPairConfig: {
          alg: "EdDSA",
          crv: "Ed25519"
        }
      }
    })
  ]
})
```

**Step 2: FastAPI JWT Verification**
```python
# backend/src/auth/jwt_verify.py
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from jose.backends.cryptography_backend import CryptographyECKey
import httpx
from functools import lru_cache
import os

security = HTTPBearer()

BETTER_AUTH_JWKS_URL = os.getenv("BETTER_AUTH_JWKS_URL")  # http://localhost:3000/api/auth/jwks
BETTER_AUTH_ISSUER = os.getenv("BETTER_AUTH_ISSUER")  # http://localhost:3000
API_AUDIENCE = os.getenv("API_AUDIENCE")  # http://localhost:8000

@lru_cache(maxsize=1)
def fetch_jwks():
    """Fetch and cache JWKS from Better Auth. Cache invalidates on restart."""
    response = httpx.get(BETTER_AUTH_JWKS_URL)
    response.raise_for_status()
    return response.json()

def get_signing_key(token: str):
    """Extract key ID from JWT header and find matching public key in JWKS."""
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    jwks = fetch_jwks()

    for key in jwks["keys"]:
        if key["kid"] == kid:
            return key

    raise HTTPException(status_code=401, detail="Invalid token: key not found")

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Verify JWT token from Authorization header.
    Returns decoded payload with user claims.
    """
    token = credentials.credentials

    try:
        # Get the signing key
        signing_key = get_signing_key(token)

        # Verify and decode
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["EdDSA"],
            issuer=BETTER_AUTH_ISSUER,
            audience=API_AUDIENCE
        )

        return payload

    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# Dependency for protected routes
def get_current_user(token_payload: dict = Security(verify_jwt_token)) -> str:
    """Extract user ID from verified JWT payload."""
    user_id = token_payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing user ID")
    return user_id
```

**Step 3: Protect FastAPI Endpoints**
```python
# backend/src/api/tasks.py
from fastapi import APIRouter, Depends
from ..auth.jwt_verify import get_current_user

router = APIRouter(prefix="/tasks")

@router.get("/")
async def list_tasks(user_id: str = Depends(get_current_user)):
    """List all tasks for authenticated user."""
    # user_id is guaranteed to be from verified JWT
    tasks = await task_service.get_tasks_by_user(user_id)
    return {"tasks": tasks}

@router.post("/")
async def create_task(task_data: TaskCreate, user_id: str = Depends(get_current_user)):
    """Create new task for authenticated user."""
    new_task = await task_service.create_task(user_id, task_data)
    return {"task": new_task}
```

**Step 4: Frontend JWT Retrieval**
```typescript
// frontend/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [jwtClient()]
})

// Usage in API calls
async function callBackendAPI(endpoint: string, options: RequestInit = {}) {
  // Get JWT token
  const { data } = await authClient.token()

  if (!data?.token) {
    throw new Error("Not authenticated")
  }

  // Call FastAPI with JWT in Authorization header
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${data.token}`
    }
  })

  return response.json()
}
```

**Environment Variables**:
```bash
# .env.local (Next.js)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://user:password@localhost:5432/todo_db
BETTER_AUTH_SECRET=<generate-32+-char-random-string>

# .env (FastAPI)
BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks
BETTER_AUTH_ISSUER=http://localhost:3000
API_AUDIENCE=http://localhost:8000
```

**Key Advantages of This Pattern**:
- No shared secrets between Next.js and FastAPI (asymmetric cryptography)
- Better Auth private key never leaves Next.js process
- FastAPI only needs public JWKS endpoint (can be cached)
- Standards-based (OAuth 2.0 / OIDC compatible)
- Supports key rotation without FastAPI code changes

**Alternative: Symmetric HS256 with Shared Secret** (NOT Recommended)

If using HS256 instead of EdDSA:
- Both Next.js and FastAPI need same `BETTER_AUTH_SECRET`
- Higher security risk (secret in two places)
- No JWKS needed (secret is the key)
- Simpler but less secure

**Why We Reject HS256**:
- Violates separation of concerns (both services have signing capability)
- Secret exposure doubles risk surface
- Cannot rotate keys independently
- Better Auth defaults to EdDSA for good reason

**Sources**:
- [Better Auth Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [Combining Next.js and NextAuth with FastAPI Backend](https://tom.catshoek.dev/posts/nextauth-fastapi/)
- [Building Secure JWT Authentication with FastAPI and Next.js](https://medium.com/@sl_mar/building-a-secure-jwt-authentication-system-with-fastapi-and-next-js-301e749baec2)

---

### 4. Security Considerations

#### JWT Expiry Strategy

**Recommendation: 1-hour access tokens**

**Rationale**:
- Balances security (limited damage window) with UX (not too frequent refreshes)
- Better Auth default is 15 minutes (too aggressive for Phase II)
- Industry standard for web apps: 15 minutes - 1 hour

**Token Lifecycle**:
```
Sign in → JWT issued (exp: now + 1h) → Valid for 1 hour → Expires
         ↓
         Session cookie (7-14 days) still valid
         ↓
         User can get new JWT via authClient.token()
```

**Implementation**:
```typescript
jwt({
  jwt: {
    expirationTime: "1h",  // Access token
  }
})
```

**Handling Expiration on Frontend**:
```typescript
// Token refresh wrapper
async function apiCallWithRefresh(endpoint: string, options: RequestInit = {}) {
  let { data } = await authClient.token()

  const response = await fetch(endpoint, {
    ...options,
    headers: { 'Authorization': `Bearer ${data.token}` }
  })

  if (response.status === 401) {
    // Token expired, get new one (Better Auth session still valid)
    const { data: newData } = await authClient.token()

    // Retry with new token
    return fetch(endpoint, {
      ...options,
      headers: { 'Authorization': `Bearer ${newData.token}` }
    })
  }

  return response
}
```

#### Refresh Token Strategy

**Better Auth Session as Refresh Token**:
- Better Auth creates session cookie (httpOnly, secure) on sign-in
- Session lasts 7-14 days (configurable)
- JWT token() endpoint requires valid session
- Effectively implements refresh token pattern

**Rotation Best Practices** (Future Enhancement - Phase III):
- Implement refresh token rotation (new refresh token on each use)
- Better Auth supports this via session rotation
- Detect refresh token reuse (security incident indicator)
- Store refresh token metadata in database for revocation

**Sources**:
- [Refresh Token Rotation Best Practices](https://www.serverion.com/uncategorized/refresh-token-rotation-best-practices-for-developers/)
- [5 Essential JWT Security Strategies](https://medium.com/@arunangshudas/5-essential-jwt-security-strategies-rotation-and-revocation-4b8bae94ed18)

#### JWT Storage: httpOnly Cookies vs localStorage

**Recommendation: In-Memory Storage (React Context) for Access JWT**

**Comparison**:

| Storage Method | XSS Vulnerability | CSRF Vulnerability | Recommended For |
|----------------|-------------------|-------------------|-----------------|
| **localStorage** | High (JS can read) | Low | Never for auth tokens |
| **httpOnly cookies** | Low (JS cannot read) | Medium (needs CSRF protection) | Refresh tokens |
| **In-memory (React state)** | Medium (per-page, not persistent) | N/A | Access tokens |

**Implementation Strategy**:
```typescript
// Auth context provider
const AuthContext = createContext<{token: string | null}>({token: null})

function AuthProvider({ children }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get token on mount if session exists
    authClient.token().then(({ data }) => setToken(data?.token || null))
  }, [])

  return (
    <AuthContext.Provider value={{ token }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Why This Works**:
- Access JWT in memory (lost on page reload → automatic token refresh)
- Session cookie (httpOnly) in browser → safe from XSS, used to get new JWT
- Minimal attack surface: Even if XSS steals JWT, it expires in 1 hour

**Security Hardening**:
1. **httpOnly cookies for session**: Better Auth default, prevents XSS access
2. **Secure flag**: HTTPS only (production)
3. **SameSite=Lax**: CSRF protection
4. **Short JWT expiry**: Limits damage from token theft
5. **CORS configuration**: Restrict API access to frontend domain

**Example Better Auth Cookie Config**:
```typescript
betterAuth({
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60  // 5 minutes
    }
  },
  advanced: {
    cookiePrefix: "todo_auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubdomainCookie: {
      enabled: false
    }
  }
})
```

**Sources**:
- [LocalStorage vs Cookies Security](https://www.cyberchief.ai/2023/05/secure-jwt-token-storage.html)
- [Understanding Token Storage: LocalStorage vs HttpOnly Cookies](https://www.wisp.blog/blog/understanding-token-storage-local-storage-vs-httponly-cookies)
- [JWT Storage in React Security Battle](https://cybersierra.co/blog/react-jwt-storage-guide/)

---

### 5. Cross-Service JWT Verification: FastAPI Best Practices

#### Pattern: JWKS Remote Verification with Caching

**Why JWKS Over Shared Secrets**:
1. **Key rotation**: Better Auth can rotate keys without FastAPI changes
2. **Security**: FastAPI never has signing capability (verify-only)
3. **Standards**: OAuth 2.0 / OIDC standard pattern
4. **Scalability**: Multiple services can verify using same JWKS endpoint

**Implementation Details**:

**Option 1: Python `jose` Library (Recommended)**
```python
from jose import jwt, jwk
from jose.backends.cryptography_backend import CryptographyECKey
import httpx
from functools import lru_cache

@lru_cache(maxsize=1)
def get_jwks():
    """Fetch JWKS and cache until process restart."""
    response = httpx.get(os.getenv("BETTER_AUTH_JWKS_URL"))
    return response.json()

def verify_token(token: str):
    # Get signing key from JWKS
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header["kid"]

    jwks = get_jwks()
    signing_key = next((k for k in jwks["keys"] if k["kid"] == kid), None)

    if not signing_key:
        raise ValueError("Signing key not found")

    # Verify and decode
    payload = jwt.decode(
        token,
        signing_key,
        algorithms=["EdDSA"],
        issuer=os.getenv("BETTER_AUTH_ISSUER"),
        audience=os.getenv("API_AUDIENCE")
    )

    return payload
```

**Option 2: Python `PyJWT` with `jwcrypto`**
```python
import jwt
from jwcrypto import jwk
import httpx
from functools import lru_cache

@lru_cache(maxsize=1)
def get_public_key():
    response = httpx.get(os.getenv("BETTER_AUTH_JWKS_URL"))
    jwks = response.json()

    # Convert JWKS to PyJWT format
    key = jwk.JWK(**jwks["keys"][0])
    return key.export_to_pem()

def verify_token(token: str):
    public_key = get_public_key()

    payload = jwt.decode(
        token,
        public_key,
        algorithms=["EdDSA"],
        issuer=os.getenv("BETTER_AUTH_ISSUER"),
        audience=os.getenv("API_AUDIENCE")
    )

    return payload
```

**Caching Strategy**:
- **Development**: Cache JWKS in-memory with `@lru_cache` (invalidates on restart)
- **Production**: Use Redis with TTL (1 hour) + background refresh
- **Reason**: JWKS rarely changes; fetching on every request is wasteful

**Redis Caching Example** (Phase III Enhancement):
```python
import redis
import json

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"))

def get_jwks_cached():
    cached = redis_client.get("better_auth_jwks")

    if cached:
        return json.loads(cached)

    # Fetch fresh JWKS
    response = httpx.get(os.getenv("BETTER_AUTH_JWKS_URL"))
    jwks = response.json()

    # Cache for 1 hour
    redis_client.setex("better_auth_jwks", 3600, json.dumps(jwks))

    return jwks
```

**Error Handling**:
```python
from fastapi import HTTPException

def verify_jwt_token(credentials: HTTPAuthorizationCredentials):
    try:
        payload = verify_token(credentials.credentials)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid audience")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid issuer")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")
```

**Key Validation Checks**:
1. **Signature**: Verify JWT signed by Better Auth private key
2. **Expiration (`exp`)**: Reject expired tokens
3. **Issuer (`iss`)**: Must match Better Auth URL
4. **Audience (`aud`)**: Must match FastAPI URL
5. **Not Before (`nbf`)**: Optional, reject tokens used too early
6. **Key ID (`kid`)**: Must exist in JWKS

**Sources**:
- [FastAPI JWT Authentication Tutorial](https://testdriven.io/blog/fastapi-jwt-auth/)
- [OAuth2 with JWT Tokens - FastAPI](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Better Stack FastAPI Authentication Guide](https://betterstack.com/community/guides/scaling-python/authentication-fastapi/)

---

## Implementation Approach (High-Level)

### Phase 1: Better Auth Setup (Next.js)

**Tasks**:
1. Install Better Auth with JWT plugin
2. Configure database adapter (PostgreSQL)
3. Create auth API routes (`/api/auth/[...all]/route.ts`)
4. Configure JWT plugin with EdDSA signing
5. Create auth client with JWT client plugin
6. Implement signup/signin UI components
7. Test token issuance via `authClient.token()`

**Deliverables**:
- Working signup/signin flow
- JWT tokens issued on successful auth
- JWKS endpoint accessible at `/api/auth/jwks`

### Phase 2: FastAPI JWT Verification

**Tasks**:
1. Install `python-jose[cryptography]` and `httpx`
2. Create JWT verification module (`auth/jwt_verify.py`)
3. Implement JWKS fetching with caching
4. Create `verify_jwt_token` dependency
5. Create `get_current_user` dependency extracting user ID
6. Configure environment variables (JWKS URL, issuer, audience)
7. Test verification with real tokens from Better Auth

**Deliverables**:
- `verify_jwt_token()` dependency working
- `get_current_user()` extracting user ID from JWT
- Proper error handling for invalid/expired tokens

### Phase 3: API Endpoint Protection

**Tasks**:
1. Apply `Depends(get_current_user)` to all task endpoints
2. Implement user isolation filters (WHERE user_id = ?)
3. Test multi-user scenarios (user A cannot access user B's tasks)
4. Implement proper HTTP status codes (401, 403, 404)
5. Add API documentation with authentication requirements

**Deliverables**:
- All task CRUD endpoints require valid JWT
- User isolation enforced at API layer
- Comprehensive error responses

### Phase 4: Frontend Integration

**Tasks**:
1. Create API client module with JWT injection
2. Implement token refresh on 401 responses
3. Handle authentication errors (redirect to signin)
4. Store JWT in React Context (in-memory)
5. Implement automatic token refresh before expiry

**Deliverables**:
- Seamless frontend → backend API calls with JWT
- Automatic token refresh on expiry
- Proper error handling and user feedback

---

## Security Best Practices Summary

### Authentication Security Checklist

- [x] **Passwords hashed with bcrypt/argon2** (Better Auth default)
- [x] **httpOnly cookies for session storage** (Better Auth default)
- [x] **Secure flag on cookies in production** (Better Auth config)
- [x] **SameSite=Lax for CSRF protection** (Better Auth default)
- [x] **Short JWT expiry (1 hour)** (Configured in JWT plugin)
- [x] **Asymmetric signing (EdDSA)** (Better Auth JWT plugin)
- [x] **JWKS for key distribution** (Better Auth JWT plugin)
- [x] **Audience and issuer validation** (FastAPI verification)
- [x] **CORS configuration restricting origins** (FastAPI middleware)
- [x] **HTTPS in production** (Deployment requirement)
- [ ] **Rate limiting on auth endpoints** (Phase III enhancement)
- [ ] **Refresh token rotation** (Phase III enhancement)
- [ ] **JWT revocation mechanism** (Phase III enhancement)

### API Security Checklist

- [x] **All task endpoints require authentication** (`Depends(get_current_user)`)
- [x] **User isolation enforced** (WHERE user_id filters)
- [x] **Input validation on all endpoints** (Pydantic models)
- [x] **Proper HTTP status codes** (401, 403, 404, 422, 500)
- [x] **Error messages don't leak sensitive info** (Generic error responses)
- [ ] **Request rate limiting** (Phase III enhancement)
- [ ] **API request logging** (Phase III enhancement)
- [ ] **SQL injection prevention** (SQLAlchemy parameterized queries)

---

## Concerns and Risks

### Risk 1: JWKS Endpoint Availability
**Concern**: If Better Auth service is down, FastAPI cannot verify tokens (JWKS fetch fails)

**Mitigation**:
- Cache JWKS aggressively (1-hour TTL in production)
- Implement JWKS fallback to Redis/database cache
- Monitor JWKS endpoint uptime
- Consider co-locating Next.js and FastAPI behind same load balancer

**Severity**: Medium (affects new requests during outage, cached JWKS continues working)

### Risk 2: Token Theft via XSS
**Concern**: If attacker injects malicious JavaScript, they could steal JWT from memory

**Mitigation**:
- Implement Content Security Policy (CSP) headers
- Sanitize all user input (task titles)
- Use React's built-in XSS protection (JSX escaping)
- Short token expiry limits damage window (1 hour)
- Regular security audits of frontend dependencies

**Severity**: Medium (requires successful XSS exploit + limited to 1-hour window)

### Risk 3: JWT Revocation Limitations
**Concern**: Cannot immediately revoke access tokens (valid until expiry)

**Mitigation**:
- Short token expiry (1 hour) limits revocation delay
- Better Auth session can be revoked (prevents new JWT issuance)
- For critical security events, implement JWT revocation list (Phase III)

**Severity**: Low (1-hour max exposure for Phase II; acceptable for MVP)

### Risk 4: Clock Skew Between Services
**Concern**: If Next.js and FastAPI servers have clock drift, token expiry validation may fail

**Mitigation**:
- Use NTP (Network Time Protocol) on both servers
- Implement leeway in JWT verification (accept tokens 5 minutes before/after `exp`)
- Monitor time sync in production

**Severity**: Low (rare with modern cloud infrastructure)

### Risk 5: CORS Misconfiguration
**Concern**: Incorrect CORS settings could block legitimate requests or allow malicious origins

**Mitigation**:
- Explicitly whitelist frontend origin in FastAPI CORS middleware
- Never use `allow_origins=["*"]` in production
- Test CORS thoroughly in development

**Example**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],  # http://localhost:3000 in dev
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"]
)
```

**Severity**: Medium (can break application or create security hole)

---

## Alternatives Considered

### Alternative 1: NextAuth.js Instead of Better Auth
**Tradeoff**: NextAuth.js is more mature and widely adopted

**Why Rejected**:
- Better Auth is the modern successor (recommended by Auth.js team for new projects)
- Better Auth has simpler API and better TypeScript support
- Better Auth JWT plugin more straightforward than NextAuth JWT strategy
- Auth.js team is focusing development on Better Auth going forward

**Sources**: [Auth.js Migration to Better Auth Guide](https://authjs.dev/getting-started/migrate-to-better-auth)

### Alternative 2: FastAPI Handles All Auth (No Better Auth)
**Tradeoff**: Single source of truth for authentication

**Why Rejected**:
- Requires building auth UI in Next.js that calls FastAPI auth endpoints
- More complex: Now Next.js must manage session state from FastAPI
- Loses Better Auth's built-in features (password hashing, session management, social auth ready)
- Violates separation of concerns (FastAPI should focus on API, not auth UI)

### Alternative 3: Shared HS256 Secret Instead of JWKS
**Tradeoff**: Simpler implementation (no JWKS endpoint needed)

**Why Rejected**:
- Security risk: Both services can sign tokens (FastAPI shouldn't have signing capability)
- Key rotation requires coordinated deployment of both services
- Violates principle of least privilege
- Not standards-based (OAuth 2.0 uses asymmetric keys)

### Alternative 4: Firebase Auth or Auth0
**Tradeoff**: Managed auth service, no self-hosting

**Why Rejected**:
- Introduces external dependency (vendor lock-in)
- Costs money at scale
- Hackathon goal is to build full-stack app, not outsource core features
- Better Auth provides same developer experience while self-hosted

---

## Technology Stack Recommendations

### Frontend (Next.js)
- **Framework**: Next.js 16+ (App Router)
- **Auth Library**: Better Auth 1.4+ with JWT plugin
- **HTTP Client**: Built-in `fetch` with JWT injection wrapper
- **State Management**: React Context for auth state (in-memory token)

### Backend (FastAPI)
- **Framework**: FastAPI 0.100+
- **JWT Library**: `python-jose[cryptography]` (EdDSA support)
- **HTTP Client**: `httpx` (async JWKS fetching)
- **Caching**: `functools.lru_cache` (dev) → Redis (production)

### Database
- **Database**: PostgreSQL 14+
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic

### DevOps
- **Environment Variables**: `.env.local` (Next.js), `.env` (FastAPI)
- **Secrets Management**: Environment variables (dev), AWS Secrets Manager (production)
- **HTTPS**: Let's Encrypt (production)
- **Monitoring**: Sentry (error tracking), Datadog (APM) - Phase IV

---

## Next Steps for Planning Phase

1. **Review this research document** with stakeholders (if applicable)
2. **Make final decision** on authentication strategy (confirm JWKS approach)
3. **Update `plan.md`** with:
   - Technical architecture section (Better Auth + JWKS verification)
   - Data model section (User and Task entities)
   - API contracts section (auth endpoints, task endpoints with JWT requirements)
4. **Create `tasks.md`** with implementation tasks based on this research
5. **Document ADR** for authentication architecture decision

---

## Sources Referenced

### Better Auth Documentation
- [Better Auth JWT Plugin](https://www.better-auth.com/docs/plugins/jwt)
- [Better Auth Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [Better Auth GitHub Repository](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/jwt.mdx)

### JWT Standards and Best Practices
- [JWT Introduction - jwt.io](https://www.jwt.io/introduction)
- [JWT Components Explained](https://fusionauth.io/articles/tokens/jwt-components-explained)
- [JWT Security Best Practices - Curity](https://curity.io/resources/learn/jwt-best-practices/)
- [JSON Web Token Claims - Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims)

### FastAPI Authentication
- [Securing FastAPI with JWT - TestDriven.io](https://testdriven.io/blog/fastapi-jwt-auth/)
- [OAuth2 with JWT - FastAPI Official Docs](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Authentication and Authorization with FastAPI - Better Stack](https://betterstack.com/community/guides/scaling-python/authentication-fastapi/)
- [Building Secure JWT Authentication with FastAPI and Next.js](https://medium.com/@sl_mar/building-a-secure-jwt-authentication-system-with-fastapi-and-next-js-301e749baec2)

### Integration Patterns
- [Combining Next.js and NextAuth with FastAPI Backend](https://tom.catshoek.dev/posts/nextauth-fastapi/)
- [Using FastAPI with Next.js and NextAuth](https://github.com/nextauthjs/next-auth/discussions/8064)
- [Handling Authentication with FastAPI and Next.js](https://www.david-crimi.com/blog/user-auth)

### Security Considerations
- [LocalStorage vs Cookies Security](https://www.cyberchief.ai/2023/05/secure-jwt-token-storage.html)
- [Understanding Token Storage: LocalStorage vs HttpOnly Cookies](https://www.wisp.blog/blog/understanding-token-storage-local-storage-vs-httponly-cookies)
- [JWT Storage in React Security Battle](https://cybersierra.co/blog/react-jwt-storage-guide/)
- [Refresh Token Rotation Best Practices](https://www.serverion.com/uncategorized/refresh-token-rotation-best-practices-for-developers/)
- [5 Essential JWT Security Strategies](https://medium.com/@arunangshudas/5-essential-jwt-security-strategies-rotation-and-revocation-4b8bae94ed18)

### Comparisons and Alternatives
- [Better Auth vs NextAuth vs Auth0 - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/)
- [BetterAuth vs NextAuth Comparison](https://www.devtoolsacademy.com/blog/betterauth-vs-nextauth/)
- [Auth.js vs BetterAuth Comprehensive Comparison](https://www.wisp.blog/blog/authjs-vs-betterauth-for-nextjs-a-comprehensive-comparison)
- [Auth.js Session Strategies](https://authjs.dev/concepts/session-strategies)
- [Migrating from Auth.js to Better Auth](https://authjs.dev/getting-started/migrate-to-better-auth)

---

**Document Status**: Complete
**Confidence Level**: High (based on official documentation and industry best practices)
**Ready for Planning**: Yes
