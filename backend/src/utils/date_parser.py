"""
Date parsing utility for natural language date expressions.

This module provides functions to parse natural language date expressions
like "tomorrow", "next week", "next month", etc. into ISO format dates
using the current system date as the base.
"""
from datetime import datetime, timedelta
import calendar
import re
from typing import Optional


def parse_natural_language_date(date_expression: str) -> Optional[str]:
    """
    Parse natural language date expressions into ISO format date string,
    using current system date as the base.

    Args:
        date_expression: Natural language date expression (e.g., "tomorrow", "next week")

    Returns:
        ISO format date string (YYYY-MM-DD) or None if parsing fails
    """
    if not date_expression:
        return None

    try:
        # Convert to lowercase for case-insensitive matching
        expr = date_expression.lower().strip()

        # Get today's date for reference - always use system date to avoid fixed context issues
        today = datetime.now().date()

        # Parse specific expressions
        if "day after tomorrow" in expr or "two days from now" in expr or "in two days" in expr:
            target_date = today + timedelta(days=2)
            return target_date.isoformat()

        elif "tomorrow" in expr or "next day" in expr or "day after today" in expr:
            target_date = today + timedelta(days=1)
            return target_date.isoformat()

        elif "yesterday" in expr:
            target_date = today - timedelta(days=1)
            return target_date.isoformat()

        elif "today" in expr or "now" in expr or "current" in expr:
            return today.isoformat()

        elif "in 1 day" in expr or "1 day from now" in expr:
            target_date = today + timedelta(days=1)
            return target_date.isoformat()

        elif "in 2 days" in expr or "2 days from now" in expr:
            target_date = today + timedelta(days=2)
            return target_date.isoformat()

        elif "in 3 days" in expr or "3 days from now" in expr:
            target_date = today + timedelta(days=3)
            return target_date.isoformat()

        elif "in 4 days" in expr or "4 days from now" in expr:
            target_date = today + timedelta(days=4)
            return target_date.isoformat()

        elif "in 5 days" in expr or "5 days from now" in expr:
            target_date = today + timedelta(days=5)
            return target_date.isoformat()

        elif "in 6 days" in expr or "6 days from now" in expr:
            target_date = today + timedelta(days=6)
            return target_date.isoformat()

        elif "in 7 days" in expr or "7 days from now" in expr:
            target_date = today + timedelta(days=7)
            return target_date.isoformat()

        # Handle "next week" - find next Monday
        elif "next week" in expr:
            # Calculate next Monday
            days_ahead = 0 - today.weekday()  # 0 is Monday
            if days_ahead <= 0:  # Target day already happened this week
                days_ahead += 7
            target_date = today + timedelta(days=days_ahead)
            return target_date.isoformat()

        # Handle "next month" - find first day of next month
        elif "next month" in expr:
            if today.month == 12:
                target_date = today.replace(year=today.year + 1, month=1, day=1)
            else:
                target_date = today.replace(month=today.month + 1, day=1)
            return target_date.isoformat()

        # Handle "next year" - find first day of next year
        elif "next year" in expr:
            target_date = today.replace(year=today.year + 1, month=1, day=1)
            return target_date.isoformat()

        # Look for weekday expressions like "next Monday", "next Tuesday", etc.
        weekday_patterns = [
            (r'next\s+monday', 0), (r'next\s+tuesday', 1), (r'next\s+wednesday', 2),
            (r'next\s+thursday', 3), (r'next\s+friday', 4), (r'next\s+saturday', 5), (r'next\s+sunday', 6)
        ]

        for pattern, weekday_num in weekday_patterns:
            if re.search(pattern, expr):
                # Find the next occurrence of this weekday
                days_ahead = weekday_num - today.weekday()
                if days_ahead <= 0:  # Target day already happened this week
                    days_ahead += 7
                target_date = today + timedelta(days=days_ahead)
                return target_date.isoformat()

        # Check for relative day expressions like "in 3 days", "3 days from now", etc.
        match = re.search(r'in\s+(\d+)\s+days?', expr)
        if match:
            days = int(match.group(1))
            target_date = today + timedelta(days=days)
            return target_date.isoformat()

        # Check for "X days from now" expressions
        match = re.search(r'(\d+)\s+days?\s+from\s+now', expr)
        if match:
            days = int(match.group(1))
            target_date = today + timedelta(days=days)
            return target_date.isoformat()

        # Check for "in X weeks" expressions
        match = re.search(r'in\s+(\d+)\s+weeks?', expr)
        if match:
            weeks = int(match.group(1))
            target_date = today + timedelta(weeks=weeks)
            return target_date.isoformat()

        # Check for "in X months" expressions
        match = re.search(r'in\s+(\d+)\s+months?', expr)
        if match:
            months = int(match.group(1))
            # Calculate target month and year
            target_month = today.month + months
            target_year = today.year + (target_month - 1) // 12
            target_month = ((target_month - 1) % 12) + 1
            # Handle day overflow (e.g., Jan 31 + 1 month should go to Feb 28/29, not Mar 3)
            max_days_in_month = calendar.monthrange(target_year, target_month)[1]
            target_day = min(today.day, max_days_in_month)
            target_date = today.replace(year=target_year, month=target_month, day=target_day)
            return target_date.isoformat()

        # Check for "in X years" expressions
        match = re.search(r'in\s+(\d+)\s+years?', expr)
        if match:
            years = int(match.group(1))
            try:
                target_date = today.replace(year=today.year + years)
            except ValueError:  # Handle leap year edge case (Feb 29 + 1 year)
                target_date = today.replace(year=today.year + years, day=28)
            return target_date.isoformat()

        # If we can't parse it, return None so the original expression can be passed through
        return None
    except Exception:
        # If any parsing fails, return None so the original expression can be passed through
        return None


def parse_datetime_with_time(date_expr: str) -> Optional[str]:
    """
    Parse date expressions that might include time information.

    Args:
        date_expr: Date expression that might include time (e.g., "tomorrow at 2 PM")

    Returns:
        ISO format datetime string (YYYY-MM-DDTHH:MM:SS) or None if parsing fails
    """
    if not date_expr:
        return None

    try:
        # Extract time information if present
        time_match = re.search(r'at\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?', date_expr, re.IGNORECASE)

        # Get the date part without time
        date_part = re.sub(r'\s+at\s+\d{1,2}(?::\d{2})?\s*(AM|PM|am|pm)?', '', date_expr, flags=re.IGNORECASE).strip()

        # Parse the date part - don't try the full expression with time as it won't match date patterns
        date_str = parse_natural_language_date(date_part)

        if not date_str:
            return None

        # If there's time information, combine it with the date
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            period = time_match.group(3).upper() if time_match.group(3) else None

            # Convert to 24-hour format if needed
            if period == 'PM' and hour != 12:
                hour += 12
            elif period == 'AM' and hour == 12:
                hour = 0

            # Ensure valid hour range
            hour = min(max(hour, 0), 23)
            minute = min(max(minute, 0), 59)

            return f"{date_str}T{hour:02d}:{minute:02d}:00"
        else:
            # Return date with 00:00:00 time
            return f"{date_str}T00:00:00"
    except Exception:
        # If any parsing fails, return None so the original expression can be passed through
        return None


def parse_date_expression(date_expr: str) -> Optional[str]:
    """
    Main function to parse a date expression, handling both date-only and datetime expressions.

    Args:
        date_expr: Natural language date expression

    Returns:
        ISO format date/datetime string or None if parsing fails
    """
    if not date_expr:
        return None

    try:
        # Try to parse as datetime first (with potential time)
        result = parse_datetime_with_time(date_expr)
        if result:
            return result

        # Fallback to date-only parsing
        result = parse_natural_language_date(date_expr)
        if result:
            return f"{result}T00:00:00"  # Add default time

        return None
    except Exception:
        # If any parsing fails, return None so the original expression can be passed through
        return None