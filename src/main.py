"""Main entry point for the Todo application.

This module initializes all dependencies and starts the application.
"""

from src.repository import TaskRepository
from src.service import TaskService
from src.ui import ConsoleUI, Controller


def main() -> None:
    """Initialize and run the Todo application.

    Sets up the dependency chain:
    Repository -> Service -> Controller -> UI
    """
    # Initialize layers
    repository = TaskRepository()
    service = TaskService(repository)
    console = ConsoleUI()
    controller = Controller(service, console)

    # Start application
    controller.run()


if __name__ == "__main__":
    main()
