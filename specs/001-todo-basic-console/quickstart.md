# Quick Start Guide: Todo In-Memory Python Console App

**Feature**: 001-todo-basic-console
**Date**: 2025-12-27
**Target Audience**: Hackathon developers setting up the project for the first time

---

## Prerequisites

Before you begin, ensure you have:

- **Python 3.13+** installed
  - Check version: `python --version` or `python3 --version`
  - Download: https://www.python.org/downloads/
- **Git** installed (for cloning repository)
- **Terminal/Console** access (Command Prompt, PowerShell, Terminal, or similar)

---

## Installation

### Step 1: Install UV Package Manager

**Linux/macOS**:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows** (PowerShell):
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Verify Installation**:
```bash
uv --version
```

Expected output: `uv 0.x.x` (or similar)

### Step 2: Clone the Repository

```bash
git clone <repository-url>
cd todo
```

*(Replace `<repository-url>` with actual repository URL)*

### Step 3: Initialize Project with UV

```bash
uv sync
```

This command:
- Creates a virtual environment
- Installs all dependencies (if any)
- Sets up the project for development

---

## Running the Application

### Launch the Todo App

```bash
uv run python src/main.py
```

You should see the main menu:
```
=== Todo App ===
1. Add Task
2. View All Tasks
3. Update Task
4. Delete Task
5. Mark Complete/Incomplete
6. Exit

Enter choice (1-6):
```

---

## Usage Examples

### Example 1: Add a Task

1. Select option `1` (Add Task)
2. Enter task title: `Buy groceries`
3. Enter description (optional): `Milk, eggs, bread`
4. Confirmation: `✓ Task 1 added successfully`

### Example 2: View All Tasks

1. Select option `2` (View All Tasks)
2. See task list:
   ```
   === All Tasks ===

   [1] [ ] Buy groceries
       Description: Milk, eggs, bread
   ```

### Example 3: Mark Task Complete

1. Select option `5` (Mark Complete/Incomplete)
2. Enter task ID: `1`
3. Confirmation: `Task 1 marked as complete`
4. View updated list:
   ```
   [1] [X] Buy groceries
       Description: Milk, eggs, bread
   ```

### Example 4: Update a Task

1. Select option `3` (Update Task)
2. Enter task ID: `1`
3. Enter new title (or press Enter to skip): `Buy groceries and snacks`
4. Enter new description (or press Enter to skip): `Milk, eggs, bread, chips`
5. Confirmation: `✓ Task 1 updated successfully`

### Example 5: Delete a Task

1. Select option `4` (Delete Task)
2. Enter task ID: `1`
3. Confirmation: `✓ Task 1 deleted`

---

## Project Structure

```
todo/
├── .specify/               # Spec-Kit Plus artifacts
│   └── memory/
│       └── constitution.md # Project principles
├── specs/                  # Feature specifications
│   └── 001-todo-basic-console/
│       ├── spec.md         # Requirements specification
│       ├── plan.md         # Implementation plan
│       ├── research.md     # Research findings
│       ├── data-model.md   # Domain model
│       ├── quickstart.md   # This file
│       └── tasks.md        # Implementation tasks
├── src/                    # Source code
│   ├── main.py             # Application entry point
│   ├── domain/             # Domain layer
│   │   ├── task.py         # Task entity
│   │   └── exceptions.py   # Custom exceptions
│   ├── repository/         # Data layer
│   │   └── task_repository.py
│   ├── service/            # Business logic layer
│   │   └── task_service.py
│   └── ui/                 # Presentation layer
│       ├── console.py      # Console I/O
│       └── controller.py   # Command routing
├── tests/                  # (Optional) Test suite
├── README.md               # Project documentation
├── CLAUDE.md               # Claude Code context
└── pyproject.toml          # UV project configuration
```

---

## Development Workflow

### 1. Review Specifications

Before coding, review the planning artifacts:
- **Constitution** (`.specify/memory/constitution.md`) - Project principles
- **Spec** (`specs/001-todo-basic-console/spec.md`) - Requirements
- **Plan** (`specs/001-todo-basic-console/plan.md`) - Architecture decisions

### 2. Follow Task Order

Implement features in the order specified in `tasks.md`:
1. Domain layer (Task model)
2. Repository layer (In-memory storage)
3. Service layer (Business logic)
4. UI layer (Console interface)
5. Integration (Main entry point)

### 3. Test Incrementally

After implementing each layer:
- Test individual components manually
- Verify integration with previous layers
- Execute acceptance scenarios from spec

### 4. Document as You Build

- Add docstrings to classes and functions
- Comment non-obvious logic
- Update README.md with any changes

---

## Troubleshooting

### Issue: `uv: command not found`

**Solution**: Restart your terminal after installing UV, or add UV to your PATH:
```bash
export PATH="$HOME/.cargo/bin:$PATH"  # Linux/macOS
```

For Windows, UV installer should add to PATH automatically. If not, add manually.

### Issue: `ModuleNotFoundError: No module named 'src'`

**Solution**: Ensure you're running from the project root directory:
```bash
cd /path/to/todo
uv run python src/main.py
```

### Issue: Python version too old

**Solution**: Install Python 3.13+:
- Download from https://www.python.org/downloads/
- Or use `pyenv` to manage multiple Python versions:
  ```bash
  pyenv install 3.13.0
  pyenv local 3.13.0
  ```

### Issue: `KeyboardInterrupt` during input

**Behavior**: Pressing Ctrl+C during input returns to main menu (graceful handling)

**Solution**: This is expected behavior. To exit, use option `6` (Exit).

---

## Testing

### Manual Testing

Execute all acceptance scenarios from `specs/001-todo-basic-console/spec.md`:

1. **Add Task** (4 scenarios)
   - Happy path: Add with title and description
   - Edge case: Add with title only
   - Error case: Attempt empty title
   - Boundary: Add with very long title

2. **Delete Task** (4 scenarios)
   - Happy path: Delete existing task
   - Error case: Delete non-existent ID
   - Error case: Delete invalid ID format
   - Edge case: Delete last task

3. **Update Task** (5 scenarios)
   - Happy path: Update title and description
   - Edge case: Update title only
   - Edge case: Update description only
   - Error case: Update with empty title
   - Error case: Update non-existent task

4. **View Tasks** (4 scenarios)
   - Happy path: View mixed complete/incomplete
   - Edge case: View empty list
   - Edge case: View only completed tasks
   - Edge case: View with very long titles

5. **Mark Complete** (4 scenarios)
   - Happy path: Mark incomplete as complete
   - Happy path: Mark complete as incomplete
   - Idempotent: Mark complete twice
   - Error case: Mark non-existent task

### Automated Testing (Optional)

If pytest is set up:
```bash
uv run pytest
```

---

## Performance Validation

### Test with 100 Tasks

1. Add 100 tasks (can script this for speed)
2. Verify all operations remain sub-second
3. Check memory usage: `< 50MB` (use Task Manager or `top`)

**Expected Results**:
- Add operation: < 100ms
- View operation: < 100ms
- Update operation: < 100ms
- Delete operation: < 100ms
- Mark complete: < 100ms

---

## Next Steps

### After Setup

1. ✅ Environment setup complete
2. ⏭️ Review spec and plan documents
3. ⏭️ Implement domain layer (`src/domain/task.py`)
4. ⏭️ Implement repository layer (`src/repository/task_repository.py`)
5. ⏭️ Implement service layer (`src/service/task_service.py`)
6. ⏭️ Implement UI layer (`src/ui/console.py`, `src/ui/controller.py`)
7. ⏭️ Create main entry point (`src/main.py`)
8. ⏭️ Execute manual acceptance tests
9. ⏭️ Write README.md and CLAUDE.md

---

## Helpful Commands

### UV Commands

```bash
# Initialize new project
uv init

# Add a dependency
uv add <package-name>

# Install all dependencies
uv sync

# Run Python script
uv run python <script.py>

# Run pytest
uv run pytest

# Show project info
uv info
```

### Git Commands

```bash
# Check status
git status

# Stage changes
git add .

# Commit with message
git commit -m "Implement domain layer"

# Push to remote
git push origin 001-todo-basic-console
```

---

## Support

### Documentation
- **Spec**: `specs/001-todo-basic-console/spec.md`
- **Plan**: `specs/001-todo-basic-console/plan.md`
- **Research**: `specs/001-todo-basic-console/research.md`
- **Data Model**: `specs/001-todo-basic-console/data-model.md`

### External Resources
- UV Documentation: https://astral.sh/uv
- Python Docs: https://docs.python.org/3/
- Spec-Kit Plus: Project templates and workflows

---

**Quick Start Status**: ✅ Ready - Follow the steps above to get started!
