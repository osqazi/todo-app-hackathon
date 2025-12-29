# Todo Console App

A simple in-memory todo list application built with Python 3.13+ for hackathon learning.

## Features

- **Add Task**: Create tasks with title and optional description
- **View All Tasks**: List all tasks with status indicators
- **Update Task**: Modify task title and/or description
- **Delete Task**: Remove tasks permanently
- **Mark Complete/Incomplete**: Toggle task completion status

## Prerequisites

- Python 3.13+
- UV package manager

### Installing UV

**Linux/macOS:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd todo
```

2. Install dependencies:
```bash
uv sync
```

3. Run the application:
```bash
uv run python src/main.py
```

## Usage

The application presents a menu-driven interface:

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

### Example Session

```
Enter choice (1-6): 1
Enter task title: Buy groceries
Enter description (optional, press Enter to skip): Milk, eggs, bread

Task 1 added successfully

Enter choice (1-6): 2

=== All Tasks ===

[1] [ ] Buy groceries
    Description: Milk, eggs, bread

Enter choice (1-6): 5
Enter task ID to toggle: 1

Task 1 marked as complete

Enter choice (1-6): 2

=== All Tasks ===

[1] [X] Buy groceries
    Description: Milk, eggs, bread
```

## Project Structure

```
todo/
├── src/
│   ├── main.py              # Application entry point
│   ├── domain/              # Domain layer
│   │   ├── task.py          # Task entity
│   │   └── exceptions.py    # Custom exceptions
│   ├── repository/          # Data layer
│   │   └── task_repository.py
│   ├── service/             # Business logic
│   │   └── task_service.py
│   └── ui/                  # Presentation layer
│       ├── console.py       # Console formatting
│       └── controller.py    # Menu routing
├── specs/                   # Feature specifications
├── pyproject.toml           # UV project config
└── README.md
```

## Architecture

The application follows a layered architecture:

```
UI Layer (Console/Controller)
        |
Service Layer (Business Logic)
        |
Repository Layer (In-Memory Storage)
        |
Domain Layer (Task Entity)
```

## Limitations

- **In-Memory Storage**: All data is lost when the application exits
- **Single User**: No multi-user or authentication support
- **No Persistence**: No file or database storage (Phase I limitation)

## Development

This project was created as part of a hackathon learning exercise following Spec-Driven Development (SDD) methodology.

### Tech Stack

- Python 3.13+
- UV (package manager)
- Python standard library only (no external dependencies)

## License

MIT
