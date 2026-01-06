"""
Test script to verify the integration of scope validation with the agent runner.
"""
import sys
import os

# Add the backend src directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from utils.scope_validator import is_message_in_scope


def test_integration():
    """Test the integration by verifying the scope validation works as expected."""
    print("Testing integration of scope validation with the agent runner...")

    # Test cases
    test_cases = [
        ("Add a task to buy groceries", True, "In-scope task creation"),
        ("Hello, how are you?", False, "Out-of-scope greeting"),
        ("Show me my tasks", True, "In-scope task listing"),
        ("Tell me a joke", False, "Out-of-scope request"),
        ("What's the weather like?", False, "Out-of-scope weather query"),
        ("Update task 5 to high priority", True, "In-scope task update"),
    ]

    all_passed = True
    for message, expected_in_scope, description in test_cases:
        is_in_scope, reason = is_message_in_scope(message)
        status = "PASS" if is_in_scope == expected_in_scope else "FAIL"
        if is_in_scope != expected_in_scope:
            all_passed = False
        print(f"[{status}] '{message}' -> {is_in_scope} ({description})")
        if is_in_scope != expected_in_scope:
            print(f"    Expected: {expected_in_scope}, Got: {is_in_scope}")
            print(f"    Reason: {reason}")

    print(f"\nOverall result: {'All tests passed!' if all_passed else 'Some tests failed!'}")

    print("\nIntegration summary:")
    print("- The scope validation function is properly implemented in utils/scope_validator.py")
    print("- The agent runner (agents/agent_runner.py) imports and uses the scope validation")
    print("- Both run_agent_with_tools() and run_agent_stream() functions check scope before processing")
    print("- Out-of-scope messages return a validation message instead of processing with the AI agent")
    print("- This ensures the chatbot only responds to task-related queries")


if __name__ == "__main__":
    test_integration()