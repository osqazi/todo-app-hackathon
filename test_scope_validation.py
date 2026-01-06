"""
Test script to verify scope validation functionality.
"""
import sys
import os

# Add the backend src directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from utils.scope_validator import is_message_in_scope


def test_scope_validation():
    """Test the scope validation function with various inputs."""
    test_cases = [
        # In-scope messages
        ("Add a task to buy groceries", True, "Adding a task"),
        ("Create a new todo for meeting tomorrow", True, "Creating a todo"),
        ("Show me my tasks", True, "Listing tasks"),
        ("Update task 5 to high priority", True, "Updating task"),
        ("Delete task 3", True, "Deleting task"),
        ("Mark task 1 as complete", True, "Completing task"),
        ("What's on my todo list?", True, "Asking about tasks"),
        ("Set a reminder for the meeting", True, "Setting reminder"),
        ("I need to finish the report", True, "Task-related"),
        ("Schedule a recurring task", True, "Recurring task"),

        # Out-of-scope messages
        ("Hello, how are you?", False, "Greeting"),
        ("Tell me a joke", False, "Requesting joke"),
        ("What's the weather like?", False, "Weather query"),
        ("Who invented the internet?", False, "General knowledge"),
        ("How to cook pasta?", False, "Recipe request"),
        ("What are the latest news?", False, "News request"),
        ("Explain quantum physics", False, "Complex explanation request"),
        ("Calculate 2 + 2", False, "Math calculation"),
        ("Translate hello to French", False, "Translation request"),
        ("Play a game with me", False, "Game request"),

        # Edge cases
        ("", False, "Empty message"),
        ("This is not related to tasks at all", False, "Generic non-task message"),
        ("I want to create a new task to finish my project", True, "Mixed message with task intent"),
    ]

    print("Testing scope validation function...\n")

    all_passed = True
    for i, (message, expected_in_scope, description) in enumerate(test_cases, 1):
        is_in_scope, reason = is_message_in_scope(message)

        status = "PASS" if is_in_scope == expected_in_scope else "FAIL"
        if is_in_scope != expected_in_scope:
            all_passed = False

        print(f"{i:2d}. [{status}] '{message}' -> {is_in_scope} ({description})")
        if is_in_scope != expected_in_scope:
            print(f"    Expected: {expected_in_scope}, Got: {is_in_scope}")
            print(f"    Reason: {reason}")
        print()

    print(f"Overall result: {'All tests passed!' if all_passed else 'Some tests failed!'}")
    return all_passed


if __name__ == "__main__":
    test_scope_validation()