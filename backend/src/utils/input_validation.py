"""
Input validation and sanitization utilities.

Prevents prompt injection, SQL injection, and other malicious inputs.
"""
import re
from typing import Optional


class InputValidationError(Exception):
    """Raised when input validation fails."""
    pass


def sanitize_chat_message(message: str, max_length: int = 5000) -> str:
    """
    Sanitize chat message to prevent prompt injection and abuse.

    Args:
        message: User's chat message
        max_length: Maximum allowed message length

    Returns:
        Sanitized message

    Raises:
        InputValidationError: If validation fails
    """
    # Check length
    if len(message) > max_length:
        raise InputValidationError(
            f"Message too long. Maximum {max_length} characters allowed."
        )

    # Check for empty/whitespace-only
    if not message.strip():
        raise InputValidationError("Message cannot be empty.")

    # Check for suspicious patterns (basic prompt injection detection)
    suspicious_patterns = [
        r"(?i)ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts?|rules?)",
        r"(?i)system\s*:\s*you\s+are",
        r"(?i)assistant\s*:\s*",
        r"(?i)new\s+instructions?\s*:",
        r"(?i)forget\s+(everything|all|your)",
        r"(?i)disregard\s+(previous|all|your)",
        r"(?i)override\s+(previous|all|your)",
    ]

    for pattern in suspicious_patterns:
        if re.search(pattern, message):
            raise InputValidationError(
                "Message contains suspicious patterns. Please rephrase your request."
            )

    # Check for excessive special characters (potential injection attempt)
    special_char_ratio = sum(1 for c in message if not c.isalnum() and not c.isspace()) / len(message)
    if special_char_ratio > 0.5:
        raise InputValidationError(
            "Message contains too many special characters. Please use normal text."
        )

    # Check for control characters
    if any(ord(c) < 32 and c not in '\n\r\t' for c in message):
        raise InputValidationError("Message contains invalid control characters.")

    # Remove potentially problematic characters but allow normal punctuation
    # Keep: letters, numbers, spaces, common punctuation
    sanitized = re.sub(r'[^\w\s\-.,!?;:()\[\]\'\"@#$%&*+=/<>]', '', message)

    return sanitized.strip()


def validate_conversation_id(conversation_id: Optional[int]) -> Optional[int]:
    """
    Validate conversation ID.

    Args:
        conversation_id: Conversation ID from request

    Returns:
        Validated conversation ID or None

    Raises:
        InputValidationError: If validation fails
    """
    if conversation_id is None:
        return None

    if not isinstance(conversation_id, int):
        raise InputValidationError("Conversation ID must be an integer.")

    if conversation_id < 1:
        raise InputValidationError("Conversation ID must be positive.")

    # Reasonable upper bound (prevent overflow)
    if conversation_id > 2**31 - 1:
        raise InputValidationError("Conversation ID is too large.")

    return conversation_id


def sanitize_error_message(error_message: str) -> str:
    """
    Sanitize error messages to prevent information leakage.

    Args:
        error_message: Raw error message

    Returns:
        Safe error message for user display
    """
    # Remove file paths
    sanitized = re.sub(r'[A-Za-z]:[\\\/][^\s]*', '[path]', error_message)

    # Remove IP addresses
    sanitized = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '[ip]', sanitized)

    # Remove stack traces
    if 'Traceback' in sanitized or 'File "' in sanitized:
        return "An internal error occurred. Please try again."

    # Truncate very long error messages
    if len(sanitized) > 200:
        sanitized = sanitized[:197] + "..."

    return sanitized
