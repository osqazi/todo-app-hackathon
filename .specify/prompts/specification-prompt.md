# Phase I: Todo In-Memory Python Console App - Basic Level Functionality

**Target audience:** Hackathon developers learning spec-driven development with Claude Code and Spec-Kit Plus, familiar with Python basics and command-line tools

**Focus:** Core CRUD task management operations, spec-driven development workflow mastery, clean console UX with clear feedback

## Success criteria:
- All 5 Basic Level features implemented and functional: Add (with title + description), Delete (by ID), Update (title/description), View (all tasks with status), Mark Complete/Incomplete toggle
- Complete spec-driven artifacts present: constitution.md defines project principles, spec.md captures requirements, plan.md documents architecture decisions, tasks.md shows implementation breakdown
- Repository structure matches specification: `.specify/memory/constitution.md`, `specs/<feature>/`, `src/` with Python modules, `README.md` with setup/usage, `CLAUDE.md` with agent instructions
- Console application provides clear user feedback: displays task IDs, shows status indicators (complete/incomplete), confirms operations, handles invalid input gracefully
- Code follows Python conventions: proper module structure, type hints where appropriate, docstrings for public functions, separation of concerns (UI/logic/data)
- Developer can clone repository, run `uv sync`, execute the app, and complete all 5 basic operations within 5 minutes without documentation ambiguity

## Constraints:
- **Word count:** README.md: 300-500 words; spec.md: 800-1200 words; plan.md: 1000-1500 words
- **Format:** Markdown for all documentation; Python 3.13+ source code; UTF-8 encoding
- **Sources:** Official Python documentation, UV documentation, Spec-Kit Plus templates (use latest versions as of December 2025)
- **Timeline:** Hackathon Phase I completion within 4-8 hours of development time
- **Storage:** In-memory only using Python data structures (list/dict); no SQLite, JSON files, or external databases
- **Interface:** Terminal/console only; no web frameworks, GUI libraries, or TUI frameworks (like Rich/Textual)
- **Dependencies:** Minimize external packages; prefer Python standard library; UV for package management only

## Not building:
- Persistent storage (file system, database, cloud storage) - Phase I is memory-only for learning fundamentals
- Advanced features from Medium/Hard levels (categories, priorities, due dates, search, filtering, sorting, recurring tasks)
- Authentication, multi-user support, or task sharing capabilities
- Web interface, REST API, or GraphQL endpoints
- Task history, undo/redo, or audit logging
- Configuration files or settings management beyond basic app behavior
- Automated tests (unit/integration) - focus is on working prototype and spec artifacts, though test planning in tasks.md is valuable
- CI/CD pipeline, deployment scripts, or containerization

---

## Summary Notes

**Assumptions made:**
- Developers have Python 3.13+ and UV already installed or can install them
- Git repository initialization and basic Git knowledge assumed
- "specs history folder" interpreted as the Spec-Kit Plus structure: `specs/<feature-name>/` containing spec.md, plan.md, tasks.md
- Task IDs will be auto-generated (integer or UUID) since deletion/update require ID-based operations
- "Mark Complete" includes toggling back to incomplete for flexibility

**Review recommendations:**
- **Timeline:** Adjust 4-8 hours if this is a timed hackathon phase with fixed duration
- **Word counts:** Adjust documentation lengths based on hackathon judging criteria (some prefer concise, others reward thoroughness)
- **Testing:** Consider if basic manual test cases in tasks.md are sufficient, or if unit tests should be added to success criteria
- **Error handling scope:** Clarify if graceful error handling (invalid IDs, empty inputs) is required or nice-to-have

**Suggested next steps:**
1. Run `/sp.constitution` to establish project principles (code quality, Python conventions, SDD practices)
2. Run `/sp.specify` with this prompt to generate `specs/todo-basic/spec.md`
3. Follow with `/sp.plan` and `/sp.tasks` to complete design artifacts before implementation
4. Use `/sp.implement` to execute tasks systematically with PHR tracking
