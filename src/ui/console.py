"""Console UI module.

This module provides console display formatting and I/O utilities
for the Todo application.
"""

from src.domain import Task


class ConsoleUI:
    """Handles console display formatting and user interaction.

    This class is responsible for all console output formatting,
    including task display, menus, messages, and input prompts.
    """

    # Display constants
    MAX_TITLE_LENGTH = 70
    MENU_OPTIONS = [
        "1. Add Task",
        "2. View All Tasks",
        "3. Update Task",
        "4. Delete Task",
        "5. Mark Complete/Incomplete",
        "6. Exit",
    ]

    def display_menu(self) -> None:
        """Display the main menu options."""
        print("\n=== Todo App ===")
        for option in self.MENU_OPTIONS:
            print(option)
        print()

    def display_tasks(self, tasks: list[Task]) -> None:
        """Display all tasks in a formatted list.

        Args:
            tasks: List of Task objects to display
        """
        print("\n=== All Tasks ===\n")

        if not tasks:
            print("No tasks yet. Add a task to get started!")
            return

        for task in tasks:
            self._display_single_task(task)
            print()

    def _display_single_task(self, task: Task) -> None:
        """Display a single task with formatting.

        Args:
            task: Task object to display
        """
        title = self._format_title(task.title)
        print(f"[{task.id}] {task.status_indicator} {title}")

        if task.description:
            print(f"    Description: {task.description}")
        else:
            print("    Description: (No description)")

    def _format_title(self, title: str) -> str:
        """Format title for console display with truncation.

        Args:
            title: Full task title

        Returns:
            Formatted title (truncated with '...' if > MAX_TITLE_LENGTH)
        """
        if len(title) <= self.MAX_TITLE_LENGTH:
            return title
        return title[: self.MAX_TITLE_LENGTH - 3] + "..."

    def display_success(self, message: str) -> None:
        """Display a success message.

        Args:
            message: Success message to display
        """
        print(f"\n[OK] {message}")

    def display_error(self, message: str) -> None:
        """Display an error message.

        Args:
            message: Error message to display
        """
        print(f"\n[ERROR] {message}")

    def display_empty_list_message(self) -> None:
        """Display message when task list is empty."""
        print("\nNo tasks yet. Add a task to get started!")

    def get_menu_choice(self) -> str:
        """Get menu choice from user.

        Returns:
            User's menu choice as string
        """
        return input("Enter choice (1-6): ").strip()

    def get_task_title(self) -> str:
        """Get task title from user.

        Returns:
            User-entered title
        """
        return input("Enter task title: ")

    def get_task_description(self) -> str:
        """Get task description from user.

        Returns:
            User-entered description (can be empty)
        """
        return input("Enter description (optional, press Enter to skip): ")

    def get_task_id(self, prompt: str = "Enter task ID: ") -> str:
        """Get task ID from user.

        Args:
            prompt: Custom prompt message

        Returns:
            User-entered ID as string
        """
        return input(prompt).strip()

    def get_update_title(self) -> str:
        """Get new title for update (empty to skip).

        Returns:
            New title or empty string to skip
        """
        return input("Enter new title (press Enter to keep current): ")

    def get_update_description(self) -> str:
        """Get new description for update (empty to skip).

        Returns:
            New description or empty string to skip
        """
        return input("Enter new description (press Enter to keep current): ")

    def display_toggle_confirmation(self, task: Task) -> None:
        """Display confirmation after toggling task status.

        Args:
            task: Task that was toggled
        """
        status = "complete" if task.completed else "incomplete"
        print(f"\n[OK] Task {task.id} marked as {status}")

    def display_update_confirmation(self, task: Task) -> None:
        """Display confirmation after updating task.

        Args:
            task: Task that was updated
        """
        print(f"\n[OK] Task {task.id} updated successfully")
        print(f"  Title: {task.title}")
        if task.description:
            print(f"  Description: {task.description}")

    def display_delete_confirmation(self, task_id: int) -> None:
        """Display confirmation after deleting task.

        Args:
            task_id: ID of deleted task
        """
        print(f"\n[OK] Task {task_id} deleted")

    def display_add_confirmation(self, task: Task) -> None:
        """Display confirmation after adding task.

        Args:
            task: Task that was added
        """
        print(f"\n[OK] Task {task.id} added successfully")

    def display_goodbye(self) -> None:
        """Display goodbye message on exit."""
        print("\nGoodbye!")
