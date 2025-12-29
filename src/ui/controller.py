"""Controller module.

This module provides the main application controller with menu routing
and command handling for the Todo application.
"""

from domain.exceptions import InvalidTaskError, TaskNotFoundError
from service.task_service import TaskService
from ui.console import ConsoleUI


class Controller:
    """Main application controller.

    Handles menu routing, user input processing, and error handling
    for all todo operations.

    Attributes:
        _service: TaskService instance for business operations
        _console: ConsoleUI instance for display and input
        _running: Flag to control the main loop
    """

    def __init__(self, service: TaskService, console: ConsoleUI) -> None:
        """Initialize controller with service and console.

        Args:
            service: TaskService instance for business operations
            console: ConsoleUI instance for display and input
        """
        self._service = service
        self._console = console
        self._running = False

    def run(self) -> None:
        """Start the main application loop.

        Displays menu and processes user commands until exit.
        Handles KeyboardInterrupt (Ctrl+C) for graceful shutdown.
        """
        self._running = True

        try:
            while self._running:
                self._console.display_menu()
                choice = self._console.get_menu_choice()
                self._handle_choice(choice)
        except KeyboardInterrupt:
            self._console.display_goodbye()

    def _handle_choice(self, choice: str) -> None:
        """Route user choice to appropriate handler.

        Args:
            choice: User's menu selection
        """
        handlers = {
            "1": self._add_task,
            "2": self._view_tasks,
            "3": self._update_task,
            "4": self._delete_task,
            "5": self._toggle_status,
            "6": self._exit,
        }

        handler = handlers.get(choice)
        if handler:
            handler()
        else:
            self._console.display_error("Invalid choice. Please enter 1-6.")

    def _add_task(self) -> None:
        """Handle add task operation."""
        try:
            title = self._console.get_task_title()
            description = self._console.get_task_description()

            task = self._service.add_task(title, description)
            self._console.display_add_confirmation(task)

        except InvalidTaskError as e:
            self._console.display_error(str(e))

    def _view_tasks(self) -> None:
        """Handle view all tasks operation."""
        tasks = self._service.list_tasks()
        self._console.display_tasks(tasks)

    def _update_task(self) -> None:
        """Handle update task operation."""
        try:
            task_id = self._get_valid_task_id("Enter task ID to update: ")
            if task_id is None:
                return

            # Show current task details
            task = self._service.get_task(task_id)
            print(f"\nCurrent title: {task.title}")
            print(f"Current description: {task.description or '(No description)'}")

            new_title = self._console.get_update_title()
            new_description = self._console.get_update_description()

            # Only update if user provided new values
            title_to_update = new_title if new_title.strip() else None
            desc_to_update = new_description if new_description else None

            updated_task = self._service.update_task(task_id, title_to_update, desc_to_update)
            self._console.display_update_confirmation(updated_task)

        except TaskNotFoundError as e:
            self._console.display_error(str(e))
        except InvalidTaskError as e:
            self._console.display_error(str(e))

    def _delete_task(self) -> None:
        """Handle delete task operation."""
        try:
            task_id = self._get_valid_task_id("Enter task ID to delete: ")
            if task_id is None:
                return

            self._service.delete_task(task_id)
            self._console.display_delete_confirmation(task_id)

        except TaskNotFoundError as e:
            self._console.display_error(str(e))

    def _toggle_status(self) -> None:
        """Handle mark complete/incomplete operation."""
        try:
            task_id = self._get_valid_task_id("Enter task ID to toggle: ")
            if task_id is None:
                return

            task = self._service.toggle_task_status(task_id)
            self._console.display_toggle_confirmation(task)

        except TaskNotFoundError as e:
            self._console.display_error(str(e))

    def _exit(self) -> None:
        """Handle exit operation."""
        self._running = False
        self._console.display_goodbye()

    def _get_valid_task_id(self, prompt: str) -> int | None:
        """Get and validate task ID from user input.

        Args:
            prompt: Prompt message for user

        Returns:
            Valid task ID as integer, or None if invalid format
        """
        id_str = self._console.get_task_id(prompt)

        try:
            task_id = int(id_str)
            if task_id <= 0:
                self._console.display_error("Invalid ID format. Please enter a positive number.")
                return None
            return task_id
        except ValueError:
            self._console.display_error("Invalid ID format. Please enter a numeric ID.")
            return None
