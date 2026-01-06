import re

def is_message_in_scope(message: str):
    """Simplified version to debug the specific issue."""
    message_lower = message.lower().strip()

    # Define patterns that indicate the message is within scope
    in_scope_patterns = [
        # Task management actions
        r'\b(add|create|new|make)\b.*\b(task|todo|to-do|item|note|reminder)\b',
        r'\b(list|show|view|display|get|fetch|find|search|look for)\b.*\b(task|todo|to-do|item|note|reminder)\b',
        r'\b(update|edit|change|modify|revise)\b.*\b(task|todo|to-do|item|note|reminder)\b',
        r'\b(delete|remove|kill|trash|cancel)\b.*\b(task|todo|to-do|item|note|reminder)\b',
        r'\b(complete|finish|done|mark as done|check|tick)\b.*\b(task|todo|to-do|item|note|reminder)\b',
        r'\b(task|todo|to-do|item|note|reminder)\b',

        # Specific task-related terms
        r'\b(priority|high|medium|low|urgent|important)\b',
        r'\b(tag|category|label|type)\b',
        r'\b(due|deadline|when|schedule|plan)\b',
        r'\b(recurrence|recurring|repeat|daily|weekly|monthly)\b',

        # Common task management phrases
        r'\b(what.*to do|what.*on my list|what.*need to do|what.*on my plate)\b',
        r'\b(my tasks|my todos|my list|my reminders)\b',
        r'\b(add.*to.*list|put.*on.*list|remind me to)\b',
        r'\b(have.*to do|need.*to do|should.*do|must.*do)\b',
        r'(show me my tasks|show tasks|list my tasks|what tasks)',
    ]

    print(f"Testing message: '{message}'")
    print("Checking in-scope patterns:")

    for i, pattern in enumerate(in_scope_patterns):
        match = re.search(pattern, message_lower)
        if match:
            print(f"  Pattern {i}: {pattern}")
            print(f"  Match: '{match.group()}'")
            return True, "Pattern match"
        else:
            print(f"  Pattern {i}: NO MATCH - {pattern}")

    # Check for task-related keywords but only if they appear in a task-related context
    task_keywords = [
        'task', 'todo', 'to-do', 'item', 'note', 'reminder', 'list', 'add', 'create',
        'delete', 'update', 'complete', 'finish', 'done', 'due', 'date', 'time',
        'priority', 'tag', 'category', 'schedule', 'plan', 'work', 'project'
    ]

    # Only consider it in scope if the message contains action words combined with task-related words
    action_keywords = ['add', 'create', 'new', 'make', 'list', 'show', 'view', 'update', 'edit',
                      'change', 'delete', 'remove', 'complete', 'finish', 'done', 'mark', 'get', 'find']

    has_action = any(action in message_lower for action in action_keywords)

    # Be more specific about task-related keywords to avoid false positives
    task_keywords_specific = [
        'task', 'todo', 'to-do', 'item', 'note', 'reminder', 'list', 'add', 'create',
        'delete', 'update', 'complete', 'finish', 'done', 'priority', 'tag', 'category',
        'schedule', 'plan', 'work', 'project'
    ]

    has_task_related = any(keyword in message_lower for keyword in task_keywords_specific)

    # Check for time/date in task context specifically
    time_context_list = [
        'due date', 'due time', 'set time', 'set date', 'at time', 'on date',
        'schedule for', 'plan for', 'task time', 'reminder time', 'deadline',
        'when due', 'due when', 'time for task', 'date for task'
    ]
    print(f"Checking time context phrases: {time_context_list}")
    has_time_context = any(context in message_lower for context in time_context_list)
    print(f"  Found matches: {[ctx for ctx in time_context_list if ctx in message_lower]}")
    print(f"  has_time_context result: {has_time_context}")

    # Check if 'time' or 'date' appear in the context of tasks specifically
    time_date_task_context_list = [
        'time for', 'date for', 'time to', 'date to', 'time task', 'date task',
        'task time', 'task date', 'todo time', 'todo date', 'reminder time', 'reminder date'
    ]
    print(f"Checking time/date task context phrases: {time_date_task_context_list}")
    has_time_date_in_task_context = any(context in message_lower for context in time_date_task_context_list)
    print(f"  Found matches: {[ctx for ctx in time_date_task_context_list if ctx in message_lower]}")
    print(f"  has_time_date_in_task_context result: {has_time_date_in_task_context}")

    # For 'work' and 'project', require more context to avoid false positives
    has_work_project_context = any(context in message_lower for context in [
        'work task', 'work todo', 'work item', 'project task', 'project todo',
        'work list', 'project list', 'work item', 'project item'
    ])

    print(f"\nKeyword checks:")
    print(f"  has_action: {has_action}")
    print(f"  has_task_related: {has_task_related}")
    print(f"  has_time_context: {has_time_context}")
    print(f"  has_time_date_in_task_context: {has_time_date_in_task_context}")
    print(f"  has_work_project_context: {has_work_project_context}")

    if (has_action and has_task_related) or has_time_context or has_time_date_in_task_context or has_work_project_context:
        print("  -> Matches keyword-based check")
        return True, "Keyword match"

    print("  -> No matches found")
    return False, "No match"

# Test the problematic message
result, reason = is_message_in_scope("what time is it?")
print(f"\nResult: {result}, Reason: {reason}")