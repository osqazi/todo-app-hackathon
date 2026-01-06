"""
Scope validation utility for Todo chatbot.

This module provides functions to validate if user messages are within the scope
of the todo application before processing them with the AI agent.
"""
import re
from typing import Tuple


def is_message_in_scope(message: str) -> Tuple[bool, str]:
    """
    Check if a message is within the scope of the todo application.

    Args:
        message: User's message to validate

    Returns:
        Tuple of (is_in_scope: bool, reason: str)
        - is_in_scope: True if message is relevant to todo tasks, False otherwise
        - reason: Explanation of why the message is in/out of scope
    """
    # Convert to lowercase for case-insensitive matching
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

    # Define patterns that indicate the message is out of scope
    out_of_scope_patterns = [
        # General conversation starters that are not task-related
        r'\b(hello|hi|hey|greetings|good morning|good afternoon|good evening|good night)\b',
        r'\b(how are you|how do you do|how are things|what.*up)\b',
        r'\b(who are you|what are you|tell me about yourself|what can you do)\b',
        r'\b(tell me a joke|make me laugh|funny|joke|comedy)\b',
        r'\b(weather|temperature|forecast|rain|snow|sunny|cloudy)\b',
        r'\b(news|current events|politics|sports|entertainment|movie|film|book|music)\b',
        r'\b(math|calculate|mathematics|equation|formula)\b',
        r'\b(translate|translation|language|speak|linguistics)\b',
        r'\b(code|programming|software|development|computer|tech|technology)\b',
        r'\b(food|recipe|cooking|restaurant|meal|dinner|lunch|breakfast)\b',
        r'\b(travel|vacation|trip|flight|hotel|destination|sightseeing)\b',
        r'\b(health|medical|doctor|medicine|treatment|symptom|disease)\b',
        r'\b(relationship|love|family|friend|marriage|dating)\b',
        r'\b(money|finance|bank|account|payment|price|cost|expensive|cheap)\b',
        r'\b(game|play|fun|entertainment|movie|tv|television|series|stream|watch)\b',
        r'\b(philosophy|meaning|life|existential|deep|thought|think|reason|purpose)\b',
    ]

    # Check if the message matches any in-scope patterns first
    for pattern in in_scope_patterns:
        if re.search(pattern, message_lower):
            return True, "Message is within the scope of the todo application."

    # Check for task-related keywords but only if they appear in a task-related context
    # Avoid matching generic phrases that just happen to contain task-related words
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
    # Exclude standalone time/date words that aren't in a task context
    task_keywords_specific = [
        'task', 'todo', 'to-do', 'item', 'note', 'reminder', 'list', 'add', 'create',
        'delete', 'update', 'complete', 'finish', 'done', 'priority', 'tag', 'category',
        'schedule', 'plan', 'work', 'project'
    ]

    # For due dates and times, require more context to avoid false positives
    has_task_related = any(keyword in message_lower for keyword in task_keywords_specific)

    # Check for time/date in task context specifically
    # Using word boundaries to avoid partial matches in other phrases
    time_context_patterns = [
        r'\bdue date\b', r'\bdue time\b', r'\bset time\b', r'\bset date\b', r'\bat time\b', r'\bon date\b',
        r'\bschedule for\b', r'\bplan for\b', r'\btask time\b', r'\breminder time\b', r'\bdeadline\b',
        r'\bwhen due\b', r'\bdue when\b', r'\btime for task\b', r'\bdate for task\b'
    ]
    has_time_context = any(re.search(pattern, message_lower) for pattern in time_context_patterns)

    # Check if 'time' or 'date' appear in the context of tasks specifically
    # Using word boundaries to avoid partial matches in other phrases
    time_date_context_patterns = [
        r'\btime for\b', r'\bdate for\b', r'\btime to\b', r'\bdate to\b', r'\btime task\b', r'\bdate task\b',
        r'\btask time\b', r'\btask date\b', r'\btodo time\b', r'\btodo date\b',
        r'\breminder time\b', r'\breminder date\b'
    ]
    has_time_date_in_task_context = any(re.search(pattern, message_lower) for pattern in time_date_context_patterns)

    # For 'work' and 'project', require more context to avoid false positives
    has_work_project_context = any(context in message_lower for context in [
        'work task', 'work todo', 'work item', 'project task', 'project todo',
        'work list', 'project list', 'work item', 'project item'
    ])

    if (has_action and has_task_related) or has_time_context or has_time_date_in_task_context or has_work_project_context:
        return True, "Message is within the scope of the todo application."

    # Check if the message matches any out-of-scope patterns only if no in-scope patterns matched
    for pattern in out_of_scope_patterns:
        if re.search(pattern, message_lower):
            return False, f"Your message '{message}' is not relevant to the scope of this application. This application is designed specifically for managing todo tasks. Please ask questions or provide commands related to creating, listing, updating, or managing your tasks."

    # If no patterns match, it's likely out of scope
    return False, f"Your message '{message}' is not relevant to the scope of this application. This application is designed specifically for managing todo tasks. Please ask questions or provide commands related to creating, listing, updating, or managing your tasks."