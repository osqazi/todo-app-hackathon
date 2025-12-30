<!-- SYNC IMPACT REPORT
Version change: 1.0.0 -> 2.0.0
Modified principles: All (Phase I console app -> Phase II web app)
Added sections: New principles for web application development
Removed sections: Console-specific constraints (UV, in-memory state)
Templates requiring updates: N/A
Follow-up TODOs: Update CLAUDE.md active technologies section
-->
# Todo Full-Stack Web App Constitution (Phase II)

## Core Principles

### Full-Stack Architecture
Implement a clean separation of concerns with Next.js 16 frontend (TypeScript 5+), FastAPI backend (Python 3.13+), and SQLModel ORM with Neon Serverless PostgreSQL; Maintain proper modular structure with clear API contracts between layers

### Spec-Driven Development
Use spec-driven development methodology with Claude Code and Spec-Kit Plus integration; Follow the workflow: /sp.specify -> /sp.plan -> /sp.tasks -> /sp.implement; All artifacts (spec.md, plan.md, tasks.md) must be complete before implementation begins

### Database Integrity & Migrations
Ensure all database schema changes use Alembic migrations with proper rollback support; Validate migrations on development database before production deployment; Maintain data integrity during schema evolution

### API-First Design
Design API contracts before implementation; Use Pydantic v2 for request/response validation; Enforce per-user task isolation on all API endpoints via JWT user_id validation

### Comprehensive Error Handling
Include comprehensive error handling for all API endpoints with appropriate HTTP status codes; Validate all user inputs server-side; Return meaningful error messages for client consumption

## Technology Constraints

### Backend Stack
- Python 3.13+ with FastAPI and SQLModel
- Pydantic v2 for data validation
- Alembic for database migrations
- Better Auth JWT for authentication
- Neon Serverless PostgreSQL database

### Frontend Stack
- TypeScript 5+ with Next.js 16 App Router
- React 19 compatible components
- Tailwind CSS for styling
- react-datepicker for date/time selection
- Browser Notification API for reminders

### Database
- PostgreSQL 15+ with ENUM types, ARRAY columns, GIN indexes
- Proper indexing strategy for query performance
- Backward-compatible schema migrations

## Success Criteria

### Functional
- All 47 functional requirements implemented and tested
- Per-user task isolation maintained (no cross-user access)
- Recurring tasks generate next instance correctly
- Browser notifications fire within 65 seconds of due time

### Performance
- API responses <200ms for 500-task lists
- Search with debouncing (<500ms update)
- Mobile responsive (>=375px width)

### Quality
- 90%+ backend unit test coverage for new code
- 80%+ frontend component test coverage
- Zero critical bugs in first week post-deployment

## Governance

All development must follow spec-driven development practices; This constitution supplements Phase I principles where applicable (error handling, validation) and extends them for full-stack web development; Constitution must be updated when project scope changes significantly; All code changes must align with stated principles.

**Version**: 2.0.0 | **Ratified**: 2025-12-30 | **Last Amended**: 2025-12-30
**Phase**: II (Full-Stack Web Application)
