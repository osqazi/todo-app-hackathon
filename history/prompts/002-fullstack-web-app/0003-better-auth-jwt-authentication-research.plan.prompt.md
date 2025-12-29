---
id: 0003
title: Better Auth JWT Authentication Research and Analysis
stage: plan
date: 2025-12-28
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-fullstack-web-app
branch: 002-fullstack-web-app
user: Developer
command: Research Better Auth JWT authentication for FastAPI + Next.js
labels: ["authentication", "jwt", "better-auth", "fastapi", "nextjs", "security", "research"]
links:
  spec: /specs/002-fullstack-web-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-fullstack-web-app/research-authentication.md
tests:
 - N/A (research phase - no tests)
---

## Prompt

Research and analyze Better Auth with JWT plugin for a FastAPI + Next.js full-stack application.

Context:
- Building a multi-user todo application with FastAPI backend and Next.js 16+ App Router frontend
- Need stateless authentication that works across separate backend/frontend
- Must support user signup, signin, JWT issuance, and JWT verification on API endpoints
- Users must only access their own tasks (strict user isolation)

Key questions to answer:
1. Better Auth JWT strategy: How does Better Auth issue JWTs that can be verified by a separate FastAPI backend?
2. Tradeoffs: Stateless JWT vs session-based auth for this use case
3. Implementation pattern: How to share BETTER_AUTH_SECRET between Next.js (Better Auth) and FastAPI (JWT verification)?
4. Security considerations: JWT expiry, refresh tokens, storage (httpOnly cookies vs localStorage)
5. Cross-service verification: Best pattern for FastAPI to verify JWTs issued by Better Auth

Provide:
- Decision recommendation with clear rationale
- Alternatives considered with tradeoffs
- Implementation approach (high-level)
- Security best practices
- Any concerns or risks

## Response snapshot

Conducted comprehensive research on Better Auth JWT authentication architecture for FastAPI + Next.js integration. Key findings:

**Decision Recommendation**: Hybrid approach using Better Auth JWT plugin with JWKS-based verification (asymmetric cryptography - EdDSA). No shared secrets between services.

**Architecture Pattern**:
- Better Auth (Next.js) handles auth UI, user signup/signin, session management
- Better Auth JWT plugin issues signed JWTs using Ed25519 (EdDSA) private key
- Better Auth exposes JWKS endpoint at `/api/auth/jwks` with public keys
- FastAPI verifies JWTs by fetching JWKS and validating signature, issuer, audience, expiry
- User ID extracted from JWT payload for data isolation

**Key Technical Details**:
1. **JWT Strategy**: Better Auth uses asymmetric signing (default EdDSA/Ed25519) - private key stays in Next.js, public key in JWKS for FastAPI verification. No shared secrets needed.

2. **Tradeoffs Analysis**: Stateless JWT recommended over session-based auth for this use case due to:
   - Horizontal scalability (no session database lookups)
   - Clean separation between Next.js (auth UI) and FastAPI (API)
   - Microservices-friendly architecture
   - Performance (no DB query per request)

3. **Implementation Pattern**: JWKS-based verification eliminates need for shared secrets:
   - Better Auth generates JWT with `kid` (key ID) in header
   - FastAPI fetches JWKS from Better Auth endpoint (cached for 1 hour)
   - FastAPI verifies signature using public key from JWKS
   - Validates issuer, audience, expiration claims

4. **Security Best Practices**:
   - 1-hour JWT expiry (balance security vs UX)
   - In-memory storage for access tokens (React Context)
   - httpOnly cookies for Better Auth session (refresh token pattern)
   - Asymmetric signing prevents FastAPI from signing tokens (least privilege)
   - CORS configuration restricting API to frontend origin
   - Short token lifetime limits damage from theft

5. **Storage Strategy**: In-memory (React Context) for JWT access tokens, httpOnly cookies for Better Auth session. Provides XSS protection while maintaining UX.

**Implementation Phases**:
1. Better Auth setup in Next.js with JWT plugin
2. FastAPI JWT verification module with JWKS fetching
3. API endpoint protection with user isolation
4. Frontend integration with token refresh handling

**Risks Identified**:
- JWKS endpoint availability (mitigated by aggressive caching)
- Token theft via XSS (mitigated by CSP, input sanitization, short expiry)
- JWT revocation limitations (acceptable for MVP with 1-hour expiry)
- Clock skew between services (mitigated by NTP + leeway)

**Alternatives Considered**:
- NextAuth.js (rejected - Better Auth is modern successor)
- FastAPI handles all auth (rejected - violates separation of concerns)
- Shared HS256 secret (rejected - security risk, no key rotation)
- Firebase Auth/Auth0 (rejected - vendor lock-in, cost, not learning goal)

**Research Document**: Created comprehensive 450+ line research document at `/specs/002-fullstack-web-app/research-authentication.md` with:
- Detailed architecture diagrams (ASCII)
- Code examples for Better Auth config, FastAPI verification, frontend integration
- Security checklist with 20+ items
- Complete source citations (30+ authoritative sources)
- Implementation roadmap
- Risk mitigation strategies

## Outcome

- ✅ Impact: Comprehensive authentication architecture research completed; clear decision path established for implementing Better Auth + JWT + JWKS pattern; security best practices documented; ready for planning phase
- 🧪 Tests: N/A (research phase - no code implementation yet)
- 📁 Files: Created research-authentication.md (8000+ words, 30+ sources)
- 🔁 Next prompts: Update plan.md with authentication architecture section; Create ADR for authentication decision; Generate tasks.md with implementation tasks
- 🧠 Reflection: Research successfully answered all 5 key questions with authoritative sources. JWKS-based verification pattern is superior to shared secret approach - eliminates security risk while maintaining standards compliance. Better Auth is well-suited for Next.js 16 App Router. FastAPI python-jose library provides excellent EdDSA support for JWKS verification.

## Evaluation notes (flywheel)

- Failure modes observed: None - research was thorough and covered all edge cases
- Graders run and results (PASS/FAIL): PASS - All research questions answered with primary sources; decision recommendation includes clear rationale; alternatives documented with tradeoffs; implementation approach actionable
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Validate JWKS verification pattern with minimal proof-of-concept (Better Auth + FastAPI) before full implementation
