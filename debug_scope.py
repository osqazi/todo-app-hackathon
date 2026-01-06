import re

# Test the specific patterns
message = "show me my tasks"
message_lower = message.lower().strip()

# Test the problematic pattern
pattern = r'\b(list|show|view|display|get|fetch|find|search|look for)\b.*\b(task|todo|to-do|item|note|reminder)\b'
print(f"Pattern: {pattern}")
print(f"Message: {message_lower}")
print(f"Match: {re.search(pattern, message_lower) is not None}")

# Check if it matches the new pattern
pattern2 = r'(show me my tasks|show tasks|list my tasks|what tasks)'
print(f"Pattern2: {pattern2}")
print(f"Match2: {re.search(pattern2, message_lower) is not None}")

# Test other patterns that might match
out_of_scope_patterns = [
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
    r'\b(game|play|fun|entertainment|movie|tv|series|show|stream|watch)\b',
    r'\b(philosophy|meaning|life|existential|deep|thought|think|reason|purpose)\b',
]

for i, pattern in enumerate(out_of_scope_patterns):
    match = re.search(pattern, message_lower)
    if match:
        print(f"Out-of-scope pattern {i} matched: {pattern}")
        print(f"Match: {match.group()}")