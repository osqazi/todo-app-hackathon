import re

# Test the specific message
message = "what time is it"
message_lower = message.lower().strip()

# Test all the in-scope patterns
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
    r'\b(due|deadline|date|time|when|schedule|plan)\b',
    r'\b(recurrence|recurring|repeat|daily|weekly|monthly)\b',

    # Common task management phrases
    r'\b(what.*to do|what.*on my list|what.*need to do|what.*on my plate)\b',
    r'\b(my tasks|my todos|my list|my reminders)\b',
    r'\b(add.*to.*list|put.*on.*list|remind me to)\b',
    r'\b(have.*to do|need.*to do|should.*do|must.*do)\b',
    r'(show me my tasks|show tasks|list my tasks|what tasks)',
]

print(f"Testing message: '{message}'")
print("In-scope patterns that match:")

for i, pattern in enumerate(in_scope_patterns):
    match = re.search(pattern, message_lower)
    if match:
        print(f"  Pattern {i}: {pattern}")
        print(f"  Match: {match.group()}")
        print()

# Check the keywords approach
task_keywords = [
    'task', 'todo', 'to-do', 'item', 'note', 'reminder', 'list', 'add', 'create',
    'delete', 'update', 'complete', 'finish', 'done', 'due', 'date', 'time',
    'priority', 'tag', 'category', 'schedule', 'plan', 'work', 'project'
]

action_keywords = ['add', 'create', 'new', 'make', 'list', 'show', 'view', 'update', 'edit',
                  'change', 'delete', 'remove', 'complete', 'finish', 'done', 'mark', 'get', 'find']

has_action = any(action in message_lower for action in action_keywords)
has_task_related = any(keyword in message_lower for keyword in task_keywords if keyword not in ['work', 'project'])

print(f"Has action keyword: {has_action}")
print(f"Has task-related keyword: {has_task_related}")
print(f"Keywords in message: {[kw for kw in task_keywords if kw in message_lower]}")