"""
Final test to demonstrate the fix for the AI chatbot out-of-scope issue.

This test demonstrates that the AI chatbot now properly responds to out-of-scope messages
with a message indicating that the request is not relevant to the application scope.
"""
import sys
import os

# Add the backend src directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from utils.scope_validator import is_message_in_scope


def test_out_of_scope_responses():
    """Test that out-of-scope messages return appropriate responses."""
    print("Testing out-of-scope message handling...")
    print("=" * 50)

    # Test various out-of-scope messages
    out_of_scope_messages = [
        "Hello, how are you?",
        "Tell me a joke",
        "What's the weather like?",
        "Who invented the internet?",
        "How to cook pasta?",
        "What are the latest news?",
        "Explain quantum physics",
        "Calculate 2 + 2",
        "Translate hello to French",
        "Play a game with me",
        "What is the meaning of life?",
        "Recommend a good movie",
        "How do I fix my car?",
        "What time is it?",
        "Tell me about history",
    ]

    print(f"Testing {len(out_of_scope_messages)} out-of-scope messages:")
    print()

    all_correct = True
    for i, message in enumerate(out_of_scope_messages, 1):
        is_in_scope, response = is_message_in_scope(message)

        if not is_in_scope:
            print(f"{i:2d}. [PASS] '{message}'")
            print(f"    -> Correctly identified as out of scope")
            print(f"    -> Response: {response[:60]}...")  # Truncate long responses
        else:
            print(f"{i:2d}. [FAIL] '{message}'")
            print(f"    -> ERROR: Should be out of scope but was identified as in scope!")
            all_correct = False
        print()

    print("=" * 50)
    print(f"Result: {'All out-of-scope messages correctly handled!' if all_correct else 'Some messages were incorrectly handled!'}")

    print("\nTesting in-scope messages to ensure they still work:")
    in_scope_messages = [
        "Add a task to buy groceries",
        "Show me my tasks",
        "Update task 5 to high priority",
        "Delete task 3",
        "Mark task 1 as complete",
        "Create a new todo for tomorrow",
        "List my high priority tasks",
        "Set a reminder for the meeting",
    ]

    all_in_scope_correct = True
    for message in in_scope_messages:
        is_in_scope, _ = is_message_in_scope(message)
        if is_in_scope:
            print(f"[PASS] '{message}' -> in scope (correct)")
        else:
            print(f"[FAIL] '{message}' -> out of scope (incorrect)")
            all_in_scope_correct = False

    print(f"\nIn-scope handling: {'All correct!' if all_in_scope_correct else 'Issues found!'}")

    overall_success = all_correct and all_in_scope_correct
    print(f"\nOVERALL RESULT: {'SUCCESS - Out-of-scope messages are properly handled!' if overall_success else 'FAILURE - Issues remain!'}")

    return overall_success


if __name__ == "__main__":
    success = test_out_of_scope_responses()
    if success:
        print("\nSUCCESS: The AI chatbot now properly responds to out-of-scope messages")
        print("   with a message indicating the request is not relevant to the application scope.")
    else:
        print("\nFAILURE: There are still issues with scope validation")